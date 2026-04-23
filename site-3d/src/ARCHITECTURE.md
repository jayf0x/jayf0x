# src — Architecture Reference

Quick orientation for the next agent working on a stage. Read before adding files.

---

## Boot sequence

```
main.js
  → createRenderer(container)   core/renderer.js  — WebGL canvas
  → createScroll()              core/scroll.js    — Lenis scroll → progress
  → createInput()               core/input.js     — pointer + touch
  → new Scene(renderer)         scenes/Scene.js   — 3D world + acts
  → createLoop({ ... })         core/loop.js      — RAF, clock, resize
  → loop.start()
```

---

## Frame loop (loop.js)

Every frame:
1. `scroll.raf(time)` — advance Lenis
2. `scene.animate(delta, elapsed, progress, input)` — update 3D world
3. `scene.render(renderer.renderer)` — draw
4. `input.flushFrame()` — clear one-shot signals (`clicked`)

---

## Scene.js

Owns camera, lights, and delegates to act modules. Key concepts:

**Camera orbit:**
`progress` [0,1) → `weightedProgressToAngle(ORBIT_WEIGHTS)` → `sin/cos` on `ORBIT_RADIUS`.
Produces a perfect circle of radius 12 m at eye height `CAMERA_EYE_HEIGHT`.
Camera always looks at world origin `(0, 0, 0)`.

**Act 3 lock:**
Once the orbit angle is within `ACT3_ANGLE_THRESHOLD` of 180°, camera lerps to the exact
180° position and freezes. Needs `ACT3_HYSTERESIS × threshold` extra scroll to escape.

**litness:**
`smoothstep(min(progress, 1-progress) * 2)` — 0 at rest (flat HTML illusion), 1 at mid-orbit (full PBR).
Passed to `act1.animate({ litness })` to drive `uLitness` uniform.

**Adding an act:**
```js
// 1. Create src/scenes/acts/actN/index.js
export function buildActN({ scene }) {
  // add geometry to scene
  return {
    animate({ delta, elapsed, progress, input }) { /* ... */ },
    onResize(width, height) { /* optional */ },
  }
}

// 2. Import + call in Scene.#buildActs()
// 3. Delegate in Scene.animate()
```

---

## Config

**`config.js`** — single source of truth for all camera and orbit constants. Import from here; never hardcode in Scene.js, act files, or stage docs.

```js
export const ACT1_DEAD_ZONE = 0.04
export const ORBIT_RADIUS = 12           // metres
export const CAMERA_EYE_HEIGHT = 1.8    // metres (180 cm)
export const ORBIT_WEIGHTS = [0.35, 0.15, 0.30, 0.20]  // drag per 90° quadrant
export const ACT3_CAMERA_POS = { x: 0, y: 0, z: -12 }  // 180° orbit position
export const ACT3_LOOK_POS   = { x: 0, y: 0, z: 0 }    // always origin
export const ACT3_ANGLE_THRESHOLD = 0.35  // radians (~20°) triggers lock
export const ACT3_HYSTERESIS = 0.8        // extra fraction needed to escape lock
```

---

## Acts

| Folder | Stage | Status |
|--------|-------|--------|
| `scenes/acts/act1/` | 1 | Phase 0 ✓ — red cube + HTML projection; real panel geometry TODO (Stage 1) |
| `scenes/acts/act2/` | 2 | Phase 0 ✓ — workspace cube + bridge rock formation; real geometry TODO (Stage 2) |
| `scenes/acts/act3/` | 3 | Phase 0 ✓ — monolith slab + camera lock; DOM overlay + GPT-1 TODO (Stage 3) |
| `scenes/act4/report.js` | 4 | Stub — consent gate + Supabase write + confetti popover TODO |

Each act lives in its own folder with `index.js` (logic) and `backlog.md` (known issues + TODOs).

---

## Core modules

| File | Purpose |
|------|---------|
| `core/renderer.js` | THREE.WebGLRenderer setup. Singleton. Handles resize + DPR cap. |
| `core/loop.js` | RAF + clock. Calls animate → render → flushFrame each tick. |
| `core/scroll.js` | Lenis wrapper. Exposes `progress` [0,1). Mobile: syncTouch. |
| `core/input.js` | Unified mouse + touch. `ndc`, `clicked`, `clickNdc`. Call `flushFrame()` each tick. |

---

## Utils

| File | Purpose |
|------|---------|
| `utils/scene.js` | `placeOnFloor(object, offset=0)` — snaps bounding-box bottom to y=offset. Use for every scene object; pass explicit offset for anything that floats. |
| `utils/html-to-canvas.js` | Rasterizes DOM element → THREE.CanvasTexture via SVG foreignObject. |
| `utils/projected-material.js` | `createProjector({ camera, texture })` — slides HTML texture onto 3D geometry. |
| `utils/collect-css.js` | Gathers all stylesheets (including cross-origin fonts as base64) for foreignObject injection. |
| `utils/math.js` | `smoothstep`, `lerp`, `clamp`, `keyframeValue`. |

---

## Projection pipeline (Act 1)

```
index.html #page element
  → HtmlToCanvas.update()          async rasterize via SVG blob
  → THREE.CanvasTexture             live texture, updates on needsUpdate
  → createProjector({ camera, texture })
      projectorCamera               frozen at REST position, never moves
      onBeforeCompile patch         injects vertex + fragment GLSL
      uniforms.uLitness             0 = flat HTML, 1 = full PBR
  → projector.applyTo(mesh)        patch mesh.material
  → projector.update()             sync camera matrices (once per frame or on change)
```

---

## Mobile notes

- **Scroll orbit**: Lenis `syncTouch: true` — single-finger swipe = camera orbit. No extra code.
- **Tap / raycasting**: `input.clicked` + `input.clickNdc` — same code path for mouse click and finger tap.
- **Touch events**: `passive: true` everywhere in input.js — keeps Lenis scroll performant.
- **CSS**: `html/body overflow: hidden; overscroll-behavior: none` — prevent pull-to-refresh.
- **Canvas**: `touch-action: none` — browser hands off pointer events to our handlers.
- **Act 3 overlays**: use `dvh` units and `env(safe-area-inset-bottom)` for virtual keyboard safety.
- **Two-finger gestures**: deliberately ignored — Lenis and browser handle them.
