# Shadow Effect — Plan

Async from PLAN.md. Tracks improvements to the shadow/projection effect quality.

---

## Current architecture (as of Stage 3)

All shadow/projection happens through the **SpotLight gobo** system:

1. `ProjectionSurface.jsx` renders 3 layers to a `WebGLRenderTarget` (2048x1024):
   - **Layer 0** (`Mp4Mesh`, renderOrder=0) — looping `/video.mp4`, base layer
   - **Layer 1** (`TextMesh`, renderOrder=1) — white text, `AdditiveBlending`
   - **Layer 2** (`VideoShadow`, renderOrder=2) — luma-threshold shadow, `NormalBlending`
2. That render target is fed into `spotLight.map` (gobo) in `SceneContent.jsx`
3. The spotlight projects the gobo onto the rocky wall GLB

The gobo scene background is `#151515` (near-black) — provides a faint base glow
so the person silhouette is visible across the entire spotlight cone, not just over text/video.

`VideoShadow.jsx` handles both webcam (live, mirrored) and `/video.mp4` (fallback) through
a luma-threshold GLSL shader: dark source pixels → opaque black in gobo → blocks light → shadow on wall.

---

## Known limitations

- **No segmentation** — shadow is purely luma-based. In a well-lit room where the person is
  bright, they won't show as shadow. Works best with backlighting or a light background.
- **Shadow only blocks content light** — the gobo base (#151515) is very dim, so the shadow
  is much more visible over the video/text area than in the "empty" parts of the beam.
- **Cave wall normals fight the projection** — the roughness/normal map on the GLB mesh
  scatters projected light, reducing readability. We want the wall to receive the projection
  cleanly but still look rocky.

---

## Future improvements (not yet implemented)

### High impact — try first

**A. Normal map suppression in projection zone**
Reduce `roughness` / `normalScale` on the wall material specifically inside the spotlight
cone using a custom `onBeforeCompile` shader injection or a secondary mesh layer.
Expected: text and shadow read much more cleanly on the craggy wall.

**B. Projection blur (soft cave diffusion)**
Add a two-pass Gaussian blur to the render target before it is fed to the spotlight map.
Implementation: ping-pong render targets with a blur kernel shader, or a custom
EffectComposer pass. A 4-8px blur makes projected light look like it is scattering on rough
stone rather than a sharp gobo.
Expected: much stronger cave feel, less "digital slide projector".

**C. Animated edge glow on shadow**
Second shader pass: detect the silhouette edge (Sobel or difference-of-gaussians) and add
a subtle emissive halo (amber/orange, animated pulse) — like heat shimmer around a shadow
from a nearby flame.

**D. Background subtraction for better silhouette**
Average first 30 frames into a static background texture. Each new frame: diff against
background. Only changed pixels become shadow. Removes ambient noise, produces clean
silhouette even in dark environments. Requires ping-pong render target at startup.

**E. Temporal accumulation / ghost trails**
Shadow memory buffer: `newAccum = shadow + prevAccum * decay`. Shadows linger and fade
slowly — fire-cast shadows flickering on the wall. `uDecay` slider (0.85-0.98) controls
trace persistence. Highest artistic potential of all approaches.

### Medium impact

**F. Gobo brightness boost via emissive blend**
Replace Mp4Mesh meshBasicMaterial with a custom shader that adds an emissive boost pass
(`color * uBrightness + uEmissive`) so dark video frames still project visibly.

**G. Spotlight color temperature animation**
Slowly animate `spotLight.color` between warm amber and cool blue — simulates fire flicker.
Subtle (+/-10% Kelvin shift) but contributes greatly to the cave illusion.

**H. Shadow sharpness control in leva**
Expose `uThreshold` and `uSoftness` from `VideoShadow.jsx` as leva controls for QA tuning
without code changes.

### Lower priority

**I. MediaPipe segmentation (proper silhouette)**
Optional path for the shadow layer. Produces a clean body-only mask regardless of lighting.
CPU cost is the main concern. Only activate in webcam mode. Luma shader stays as video fallback.

**J. Contour-only mode**
Shader variant: only the silhouette edge (2-4px) renders as shadow, not the filled body.
Outline-only projection — very cave-painting aesthetic.

---

## Notes

- All shader work lives in `VideoShadow.jsx` and `ProjectionSurface.jsx`
- Wall material changes go in `SceneContent.jsx` → `WallMesh`
- Test with `/video.mp4` first (controlled source), then live webcam
- User does visual QA — no automated tests
