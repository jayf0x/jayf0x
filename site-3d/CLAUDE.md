# CLAUDE.md — Agent Instructions

This is a Three.js portfolio with four acts, scroll-driven camera orbit, and an in-browser GPT-1 terminal. Read this file first, every session.

---

## Quick start

```bash
bun dev       # always bun, never npm
bun run build
```

Dev server: `http://localhost:5174/` (or 5173 if port is free)

---

## What to read before working

| File | When to read |
|------|-------------|
| `CLAUDE.md` (this file) | Every session — rules + structure |
| `DESIGN.md` | Once — understand the full vision |
| `stages/stage-N/DESIGN.md` | Your stage only — actionable spec |
| `stages/stage-N/backlog.md` | Your stage only — known issues |
| `src/ARCHITECTURE.md` | When adding files or touching core modules |
| `backlog.md` | If your work intersects a cross-cutting concern |

**Don't read** other stages' design files. Don't read `ideas/` files unless your stage spec references one by name.

---

## Project structure

```
src/
  main.js                     entry point
  config.js                   scroll zone constants — always import from here
  core/
    renderer.js               WebGL renderer (singleton)
    loop.js                   RAF + clock
    scroll.js                 Lenis → progress [0, 1)
    input.js                  unified mouse + touch
  scenes/
    Scene.js                  camera orbit, delegates to acts
    acts/
      act1/
        index.js              Stage 1 — front face illusion
        backlog.md
      act2/
        index.js              Stage 2 — workspace + bridge
        backlog.md
      act3/
        index.js              Stage 3 — monolith
        backlog.md
    act4/
      report.js               Stage 4 — consent gate + Supabase + confetti popover
  utils/
    scene.js                  placeOnFloor(object, offset?) — floor snapping for all scene objects
    html-to-canvas.js         DOM element → THREE.CanvasTexture
    projected-material.js     slide-projector shader patch
    collect-css.js            embed stylesheets for foreignObject
    math.js                   smoothstep, lerp, clamp, keyframeValue
  dev/
    debug.js                  lil-gui + stats.js (DEV only)
  style.css                   Tailwind v4 + mobile base rules

stages/
  stage-1/                    Act 1 spec + backlog
  stage-2/                    Act 2 spec + backlog
  stage-3/                    Act 3 spec + backlog
  stage-4/                    Act 4 spec + backlog
  post-launch/                performance, memory, optional features

user-info/
  about.md                    Jonatan's bio, experience, projects
  late-night-claude.md        easter egg file (shown in Act 3 editor)

ideas/                        creative references — don't read unless referenced
public/                       static assets (project textures go in public/projects/)

DESIGN.md                     full concept vision
backlog.md                    cross-cutting concerns
```

---

## Rules

**Dependencies:** `bun add` only. Never `npm install`. Run `bun dev` not `npm run dev`.

**TypeScript:** Optional. Type at module boundaries (exported function signatures). Loose or untyped inside render loops, animation logic, and experimental act code. Don't force types where Three.js types are redundant or verbose.

**Comments:** Write why, not what. A comment on a shader patch is useful. A comment that says "adds the mesh" is not.

**Imports:** Use `.js` extensions in import paths (Vite ESM requirement).

**Dev tools:** `src/dev/debug.js` (lil-gui + stats.js). Import lazily in main.js behind `import.meta.env.DEV`. Never import dev tools from non-dev code.

**No cross-stage dependencies:** act2.js must not import from act1.js, and vice versa. Shared logic belongs in `utils/`. If you find yourself wanting to import between acts, add a util instead.

---

## Act module interface

Every act module must export a builder function that returns this shape:

```js
export function buildActN({ scene, ...params }) {
  // add geometry to scene here

  return {
    // called every frame — destructure only what you need
    animate({ delta, elapsed, progress, litness, input }) { },

    // optional — implement if act has resizable DOM elements or cameras
    onResize(width, height) { },

    // optional — called by Scene.js to free GPU memory when act is far away
    dispose() { },
  }
}
```

`Scene.js` calls `actN.animate(...)` every frame. Arguments:
- `delta` — seconds since last frame
- `elapsed` — total seconds
- `progress` — scroll progress [0, 1), drives camera orbit
- `litness` — 0 at rest (flat HTML illusion), 1 at full orbit (full PBR)
- `input` — `{ ndc, px, pressed, clicked, clickNdc }` from `core/input.js`

---

## Config constants — always use `src/config.js`

All camera, orbit, and zone values live in `src/config.js`. **Never hardcode them.**

```js
import { ACT1_DEAD_ZONE, ORBIT_RADIUS, ORBIT_WEIGHTS, CAMERA_EYE_HEIGHT } from '../config.js'
```

| Export | Value | Meaning |
|--------|-------|---------|
| `ACT1_DEAD_ZONE` | `0.04` | Scroll dead zone — camera doesn't move until this is exceeded |
| `ACT1_ZONE` | `{ enter: 0.0, exit: 0.12 }` | Act 1 active band (reference) |
| `ACT2_ZONE` | `{ enter: 0.12, exit: 0.88 }` | Act 2 active band (reference) |
| `ACT3_ZONE` | `{ enter: 0.42, exit: 0.58 }` | Act 3 zone (reference only — lock uses angle, not progress) |
| `ACT3_CAMERA_POS` | `{ x:0, y:0, z:-12 }` | 180° orbit position — where camera locks for Act 3 |
| `ACT3_LOOK_POS` | `{ x:0, y:0, z:0 }` | Look-at target (origin) |
| `ORBIT_RADIUS` | `12` | Radius of the circular camera rail (metres) |
| `CAMERA_EYE_HEIGHT` | `1.8` | Camera y (1 unit = 1 m, so 1.8 = 180 cm person height) |
| `ORBIT_WEIGHTS` | `[0.35, 0.15, 0.30, 0.20]` | Scroll drag per 90° quadrant — higher = slower camera |
| `ACT3_ANGLE_THRESHOLD` | `0.35 rad` | Angle from 180° that triggers Act 3 lock (~20°) |
| `ACT3_HYSTERESIS` | `0.8` | Extra scroll fraction needed to escape the Act 3 lock |

## Scene constants (from Scene.js)

| Constant | Value | Meaning |
|----------|-------|---------|
| `CAMERA_FOV` | `45°` | Perspective FOV |
| Orbit | radius 12, y = `CAMERA_EYE_HEIGHT` | Camera moves on a perfect circle, always looks at origin |
| Scene background | `#faf8f5` | Warm off-white — must match `#page` bg |
| Fog | `FogExp2, density 0.022` | Hides scene bounds, sells bridge depth |

**Scene layout:** 0° = Act 1 (front), 90° = Act 2 (side, +x), 180° = Act 3 (back). Camera always looks at world origin `(0, 0, 0)`.

---

## Mobile setup (already done — don't duplicate)

- `style.css`: `overflow: hidden`, `overscroll-behavior: none`, `touch-action: none` on `#app`
- `index.html`: `viewport-fit=cover`, `interactive-widget=resizes-content`
- `core/input.js`: unified mouse + touch, `passive: true` listeners
- `core/scroll.js`: Lenis `syncTouch: true`
- Act 3 overlays: use `dvh` units, `env(safe-area-inset-bottom)` for keyboard safety

---

## Adding a new utility

1. Create `src/utils/your-util.js`
2. Export named functions (no default exports in utils)
3. Add a one-line entry to the utils table in `src/ARCHITECTURE.md`
4. Import with the `.js` extension

---

## Performance rules (brief — full spec in `stages/post-launch/backlog.md`)

- Cap DPR at 2 (already done in `renderer.js`)
- Shadow map stays at 2048×2048 for key light; halve it if frame budget is tight
- Dispose of geometry and materials when an act goes dormant (see post-launch backlog for full strategy)
- Don't `console.log` in the render loop

---

## Commit style

```
act1: red panel geometry + projection wired
act2: project cube raycasting
fix: scroll progress edge case on mobile
```
