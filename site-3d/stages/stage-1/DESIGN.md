# Stage 1 — Act 1: The Front Face

> Read `CLAUDE.md` and `DESIGN.md` first, then this file.

**Goal:** The scene looks like a perfectly flat red panel at scroll position 0. One scroll and it reveals itself as a 3D gallery room.

---

## Acceptance criteria

- [ ] At `progress = 0`: visitor sees a clean flat composition — red rectangle, name, resume button. Looks 2D.
- [ ] At `progress = 0.1`: 3D depth is clearly visible — panel edge, room walls, shadows.
- [ ] The HTML (resume button) stays cleanly projected on the panel face throughout the orbit.
- [ ] `uLitness` transitions smoothly: flat look at rest, full PBR at mid-orbit.
- [ ] Runs at 60fps on a mid-range laptop (check with the stats panel in `bun dev`).

---

## File to implement

**`src/scenes/acts/act1.js`** — the projection infrastructure is already wired. You need to add geometry.

The stub already has:
- `projectorCamera` (cloned from main camera, frozen at REST)
- `HtmlToCanvas` rasterizer pointed at `#page`
- `createProjector` patching all meshes via `projector.applyTo(mesh)`
- `animate({ litness })` driving `uLitness`

**What's missing:** the actual geometry. Add it between the `projector.update()` call and the return statement.

---

## Geometry to build

### 1. The panel (main surface)

```js
const panel = new THREE.Mesh(
  new THREE.BoxGeometry(16, 9, 0.15),
  new THREE.MeshStandardMaterial({ color: 0xfd453a }) // --color-bright from style.css
)
panel.position.set(0, 0, 0)
panel.castShadow = true
panel.receiveShadow = true
scene.add(panel)
projector.applyTo(panel)
```

`BoxGeometry` not `PlaneGeometry` — the 0.15 depth reveals the panel as a physical slab when orbiting, which is the moment the illusion breaks.

The HTML texture is projected from the rest position and blends with the red face (`uLitness`). At `uLitness = 0`: visitor sees pure HTML. At `uLitness = 1`: red surface with PBR lighting.

### 2. Gallery room (behind the panel)

Extends from `z = 0` to `z = -18`. All geometry sits behind the panel — invisible when front-on, revealed by orbit.

```
Left wall:   x = -11, z center = -9, size 18 × 11, rotation.y = PI/2
Right wall:  x =  11, z center = -9, size 18 × 11, rotation.y = -PI/2
Back wall:   z = -18, size 22 × 11, no rotation (faces +z)
Floor:       y = -5.5, z center = -6, size 22 × 24, rotation.x = -PI/2
Ceiling:     y =  5.5, z center = -9, size 22 × 18, rotation.x =  PI/2
```

Wall color: `0xf0ebe4` (warm stone). Floor: `0xddd5ca` (slightly darker).

All walls: `receiveShadow = true`. No `castShadow` on walls.

### 3. Minimal scene furniture (optional but recommended)

One dark plinth + IcosahedronGeometry sculpture deep in the room to give the space life when the camera orbits to the back:

```js
// Plinth
const plinth = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 3.5, 1.2),
  new THREE.MeshStandardMaterial({ color: 0x2a2520 })
)
plinth.position.set(3, -5.5 + 1.75, -14)
plinth.castShadow = true

// Sculpture on top
const sculpture = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.7, 1),
  new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 0.6, metalness: 0.1 })
)
sculpture.position.set(3, -5.5 + 3.5 + 0.7, -14)
sculpture.castShadow = true
```

---

## The anamorphic illusion

No shader tricks needed. The illusion is achieved by:

1. The panel filling most of the viewport at rest (camera at `z=12`, FOV 45°, panel 16×9)
2. The gallery walls sitting entirely at `z < 0` — behind the panel, occluded from the front
3. `uLitness = 0` at rest → panel shows pure flat HTML, no shading, no 3D cues
4. Background color `#faf8f5` matches the `#page` background → panel edges invisible

When the camera starts orbiting:
- Panel edge becomes visible (BoxGeometry depth)
- Gallery walls emerge from behind the panel
- `uLitness` ramps up → PBR shading kicks in
- Fog handles the far end gracefully

---

## HUD (rotation arc indicator)

The `#hud` div in `index.html` is a stub. Stage 1 should show a minimal half-circle arc that appears once `progress > 0.02` and disappears at `progress < 0.01`. It communicates "you can scroll to orbit."

Simple implementation: a `<canvas>` inside `#hud`, draw an arc with `ctx.arc()` proportional to `progress`. Toggle `opacity` via CSS transition.

---

## index.html #page content

The resume button design is already in place. Check that it reads clearly at the projected resolution. If font rendering looks soft: increase `pixelRatio` in the `HtmlToCanvas` constructor (already at `Math.min(devicePixelRatio, 2)`).

To change copy or layout: edit the `#page` div in `index.html`. The background (`#faf8f5`) must not be changed — it must match `scene.threeScene.background`.

---

## Debug panel (lil-gui)

In `src/dev/debug.js`, a TODO comment marks where to add an Act 1 folder. Add it like this inside `buildAct1` (import `GUI` dynamically if needed, or pass the gui instance in):

```js
// Inside buildAct1, after creating panel:
if (import.meta.env.DEV) {
  import('lil-gui').then(({ default: GUI }) => {
    const gui = new GUI({ title: 'Act 1' })
    gui.add(panel.material, 'color') // live color tweak
    const uniforms = projector.uniforms
    gui.add(uniforms.uLitness, 'value', 0, 1, 0.01).name('litness (manual)')
  })
}
```

---

## What Stage 1 does NOT own

- Act 2 geometry (workspace, bridge) — stub only
- Act 3 geometry / DOM overlays — stub only
- Camera keyframes — defined in `Scene.js`, tweak there if orbit feels wrong
- Scroll speed — `#scroll-spacer` height in `style.css` (currently 400vh)
