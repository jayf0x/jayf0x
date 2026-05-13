# Shadow Effect — Demo Plan

Async from PLAN.md. Goal: find the best shadow technique before wiring it into the main scene.
Each demo is an isolated standalone page. Once a winner is found, it replaces the MediaPipe approach in `ProjectionCanvas.jsx` / Stage 1 of PLAN.md.

---

## Setup

All demos live in `src/demos/shadow/`.
Add routes in `App.jsx` or a dedicated `DemoApp.jsx` (swap `main.jsx` entry during dev).

**Test video:** drop `public/test-video.mp4` — should contain moving objects (hands, person, car, pet — something with distinct silhouette against a plain background). Demos support toggling between test video and live webcam.

Each demo exports a `getShadowTexture(renderer, videoTexture) → THREE.Texture` function so they're swappable once a winner is picked.

---

## Demo A — Threshold shader (baseline)

**Technique:** grayscale → contrast boost → threshold cutoff. Dark pixels become shadow, light become transparent. Entire pipeline in a GLSL fragment shader applied to a `VideoTexture`.

**Expected look:** crude, unstable, very "cave painting". Probably the strongest aesthetic of all.

**Why test first:** near-zero cost, works on any device, no libs.

Files:
- `src/demos/shadow/DemoA.jsx` — R3F scene, plane mesh, shader material
- `src/demos/shadow/shaders/threshold.glsl`

Shader inputs:
- `uVideo` — video texture
- `uThreshold` — float 0–1 (UI slider)
- `uContrast` — float multiplier
- `uInvert` — bool (dark or light silhouette)

UI controls: threshold slider, contrast slider, source toggle (webcam / test video).

**Morphology:** add optional `uBlurRadius` for soft shadow edges — keeps fire-lit feel.

---

## Demo B — Background subtraction

**Technique:** average first N frames into a static background texture. Each new frame: `abs(current - background)`. Diff above threshold = foreground = shadow.

**Expected look:** environment disappears, only moving subjects survive. Very strong for public-space / outdoor footage.

**Why test:** research notes say this "may actually be the strongest baseline technique".

Files:
- `src/demos/shadow/DemoB.jsx`
- `src/demos/shadow/shaders/bg-subtract.glsl`

Implementation:
- Capture background by averaging 30–60 frames at startup (or on keypress `R` to re-learn)
- Store as `THREE.WebGLRenderTarget` (background accumulation texture)
- Fragment shader: diff + threshold + morphology dilation (fill small holes)

Shader inputs:
- `uVideo` — current frame
- `uBackground` — learned background texture
- `uSensitivity` — diff threshold
- `uDilation` — morphology radius

UI: "Re-learn background" button, sensitivity slider, source toggle.

**Test with test video:** use footage with a static background and something moving through it (car, person).

---

## Demo C — Temporal accumulation / ghost trails

**Technique:** diff current frame vs previous frame → only moving pixels survive → accumulate into a "memory" buffer with exponential decay.

**Expected look:** motion leaves traces, stationary subjects fade. Ritual echoes, spirit trails. Movement memory.

**Why test:** highest artistic potential per the research notes. "The wall remembering movement."

Files:
- `src/demos/shadow/DemoC.jsx`
- `src/demos/shadow/shaders/temporal-diff.glsl`
- `src/demos/shadow/shaders/accumulate.glsl`

Implementation (ping-pong render targets):
1. `temporal-diff.glsl`: `abs(currentFrame - prevFrame)` → motion mask
2. `accumulate.glsl`: `newAccum = motionMask + prevAccum * uDecay`
3. Render accumulated texture as shadow

Shader inputs:
- `uCurrent` — current video frame
- `uPrev` — previous frame (render target)
- `uAccum` — accumulated shadow buffer
- `uDecay` — float 0.8–0.99 (slow fade = long ghost, fast fade = crisp motion)
- `uMotionThreshold` — diff sensitivity

UI: decay slider, threshold slider, source toggle.

---

## Demo D — MediaPipe + morphological cleanup

**Technique:** current MediaPipe selfie segmentation (already in `ProjectionCanvas.jsx`) but with proper GPU-side morphological cleanup instead of raw mask output.

**Why test:** baseline comparison. The current implementation applies the mask directly with no cleanup — this tests whether cleanup alone fixes its weaknesses.

Files:
- `src/demos/shadow/DemoD.jsx`
- `src/demos/shadow/shaders/morphology.glsl`

Morphology shader passes (applied to MediaPipe output mask):
1. Erosion (remove noise)
2. Dilation (fill holes, thicken)
3. Gaussian blur (soft edges — fire-lit feel)
4. Optional: edge detection pass for contour-only mode

Shader inputs:
- `uMask` — raw MediaPipe segmentation texture
- `uErosion` / `uDilation` — kernel radius
- `uBlur` — blur radius
- `uContourOnly` — bool

UI: all morphology sliders, contour toggle, source toggle.

---

## Demo E — Combo / focus slider

Only build this after A–D are evaluated.

**Concept:** single slider from 0–100 that blends techniques:
- 0–25%: Demo A (threshold only)
- 25–50%: Demo B (background subtraction)
- 50–75%: Demo C (temporal accumulation)
- 75–100%: Demo D (MediaPipe + cleanup)

Each step is a qualitatively different abstraction, not just "more accurate".

Files:
- `src/demos/shadow/DemoE.jsx` — imports shaders from A–D

---

## Evaluation criteria per demo

After running each demo with test video + webcam, note:
- Aesthetic quality (does it feel like cave shadows?)
- Edge stability (too noisy? too clean?)
- Performance (FPS on laptop, FPS on phone if tested)
- Failure modes (breaks when X happens)
- Emotional feel

Winner feeds into PLAN.md Stage 1 as the `getShadowTexture` implementation.

---

## Notes for agent

- All shaders use `THREE.ShaderMaterial` inside R3F, not post-processing passes — keeps it composable
- Ping-pong render targets pattern: two `THREE.WebGLRenderTarget`, swap each frame
- `VideoTexture` from Three.js wraps a `<video>` element — same source works for both test video and webcam
- Test video source: `const src = mode === 'webcam' ? stream : '/test-video.mp4'`
- Keep each demo runnable in isolation — no imports from main app except `useCamera.js`
- Current MediaPipe approach to replace: `ProjectionCanvas.jsx:125–170` (selfie segmentation loop)
