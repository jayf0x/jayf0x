# Stage 1 — Act 1 Implementation Notes

> Concept and design decisions live in root `DESIGN.md → Act 1`. Read that first.
> Known issues and open questions live in `stages/stage-1/backlog.md`.

---

## Iteration 1 scope

Single goal: the illusion is visible. Panel exists, HTML is projected, `uLitness` transitions.

- [ ] Red panel visible at `progress = 0`
- [ ] HTML texture (resume button) projected cleanly on the panel face
- [ ] Obvious 3D depth visible when orbiting to ~10% scroll
- [ ] `uLitness` transition works (flat at 0°, lit at mid-orbit)

---

## File to implement

**`src/scenes/acts/act1/index.js`** — projection infrastructure already wired. Add geometry only.

Already in the stub:
- `projectorCamera` — cloned from main camera, frozen at 0°, never moves
- `HtmlToCanvas` — rasterizes `#page` to a canvas texture
- `createProjector` — patches mesh materials via `projector.applyTo(mesh)`
- `animate({ litness })` — drives `uLitness` uniform
- `placeOnFloor` available from `utils/scene.js`

---

## Panel geometry

```js
import { placeOnFloor } from '../../../utils/scene.js'

const panel = new THREE.Mesh(
  new THREE.BoxGeometry(16, 9, 0.15),
  new THREE.MeshStandardMaterial({ color: 0xfd453a })
)
panel.castShadow = true
panel.receiveShadow = true
placeOnFloor(panel, 4.5)   // lift so it centres in camera view at eye height 1.8 m, z=12
scene.add(panel)
projector.applyTo(panel)
projector.update()
```

`BoxGeometry` not `PlaneGeometry` — the 0.15 depth is what sells the reveal on orbit.

---

## Background colour — must match exactly

`index.html #page` background and `scene.background` must both be `#faf8f5`. This makes the panel edges invisible at 0°. Do not change either without updating both.

---

## Backing geometry (Iteration 2)

Any geometry at `z < 0` is behind the panel and invisible from 0°. Leave empty for Iteration 1.
Add in Iteration 2 if the orbit reveal feels empty. Use `placeOnFloor(mesh)` for anything floor-level.

---

## HUD arc (Iteration 2)

`#hud` div is a stub in `index.html`. Implement in Iteration 2:
- Canvas inside `#hud`, arc proportional to `progress` via `ctx.arc()`
- Show when `progress > 0.02`, hide at `progress < 0.01`
