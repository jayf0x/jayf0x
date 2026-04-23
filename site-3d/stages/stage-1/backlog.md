# Stage 1 Backlog

Issues and open questions scoped to Act 1.

---

## HUD arc indicator — implementation detail
- Simple canvas arc proportional to `progress`, toggled by CSS opacity
- Decide: canvas element or pure SVG? (SVG might be cleaner for the arc shape)
- Disappear once user reaches Act 2 zone (`progress > 0.25`), and once in Act 3 entirely

## Panel aspect ratio on resize
- Panel is 16×9 world units, camera FOV is 45°
- On very wide viewports (ultrawide): panel may not fill horizontal space — decide if that's acceptable or if panel should scale with viewport
- Consider: `THREE.MathUtils.degToRad(CAMERA_FOV / 2)` math to compute visible width at z=12

## Font rendering quality on the projected panel
- `HtmlToCanvas` renders at `pixelRatio = min(devicePixelRatio, 2)`
- On 1x displays, type may look soft — test and increase if needed (cost: texture memory)
- On retina: should be sharp at 2x

## "Download Resume" — what does it link to?
- Act 1 is a projection — the button is not actually clickable (it's painted on geometry)
- The real download should be wired in Act 3 (the editor has the file)
- For Stage 1: button is visual only. Add a small DOM overlay button on top of the canvas at rest position? Or accept that clicking the 3D surface does nothing and the user discovers Act 3?
- Recommendation: accept non-interactive for now. Real download lives in Act 3.

## ACT1_DEAD_ZONE — tuning the "locked" feel
- `ACT1_DEAD_ZONE = 0.04` in `src/config.js` suppresses camera motion until the user has scrolled intentionally
- Too low: camera drifts on first scroll tick, ruining the flat-panel illusion
- Too high: user wonders if the page is broken before anything moves
- Tune during Stage 1 development; edit `src/config.js` only — do not hardcode in `Scene.js`

## Anamorphic precision — how tight?
- "Everything reads flat at 0°" is partly achieved by occlusion (walls hidden behind panel)
- For a tighter illusion: place a few Act 2 objects such that from 0° they're perfectly occluded by the panel silhouette. This is a nice-to-have, not a blocker.
- If pursued: place objects at `x ∈ [-8, 8]`, `y ∈ [-4.5, 4.5]`, `z < 0` — behind the panel
