# Stage 2 Backlog

---

## Project assets not yet available
- Need actual screenshots / GIFs for cube textures
- Placeholder: solid color + text label canvas texture is fine for development
- Source: `user-info/about.md` has project list and GitHub URLs

## Camera needs access in buildAct2
- Raycasting requires the main camera
- Update `Scene.js`: `buildAct2({ scene, camera })` and pass it through
- Currently the stub signature only receives `{ scene }`

## cursor-effect-01.js integration
- Read `ideas/cursor-effect-01.js` before using — it's a standalone canvas, needs adaptation
- Needs: a canvas element positioned over #app, pointer events forwarded from input.js
- Or: port the noise logic to work directly in Three.js (InstancedMesh for lines)
- Decision: start with the overlay canvas approach (easier), migrate if it causes z-fighting

## GIF textures
- Three.js TextureLoader doesn't animate GIFs — they load as a static first frame
- Options:
  1. Use static PNG screenshots (simplest)
  2. Use a canvas updated via `requestVideoFrameCallback` + `<video>` (GIF → video conversion)
  3. Use `three-gif-loader` package
- Recommendation: ship with PNGs for Stage 2, upgrade to animated later

## Bridge company logos
- Bricsys logo: needs a PNG asset, check licensing before including
- Placeholder: company color as solid face color is sufficient for Stage 2
- Full logo textures can be added post-launch

## Pillar count vs. performance
- Each pillar = geometry + material + draw call
- Keep pillar count ≤ 6 and use `THREE.InstancedMesh` if more are needed
- Bridge deck: one large PlaneGeometry/BoxGeometry, not per-segment

## Cursor effect z-order
- If using a DOM canvas overlay, ensure `pointer-events: none` is set
- Canvas z-index must be above WebGL canvas (z-index > 35) but below Act 3 overlays (z-index < 50)
- z-index 42 is available
