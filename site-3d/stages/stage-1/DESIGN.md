# Stage 1 — Act 1: The Front Face

> Read `CLAUDE.md` and `DESIGN.md` first, then this file.

**Goal:** At scroll position 0 the scene is indistinguishable from a flat website. Scroll reveals it was a 2D projection on 3D geometry the whole time.

---

## The illusion

This is an optical illusion, not a gallery or a room. The mechanics:

1. **At rest (`uLitness = 0`):** flat HTML is projected onto the panel face. No shading, no 3D cues. Panel edges are invisible because the background colour `#faf8f5` matches the scene background and `#page` background exactly.
2. **On orbit:** `uLitness` ramps up, PBR lighting activates, panel edges appear, and any geometry placed behind the panel becomes visible — clearly 3D, clearly a scene.
3. **Lighting contrast:** the key light can dramatically shadow background geometry. At 0° those shadows are hidden behind the panel. On orbit the shadows sell the depth.

There is no gallery. There is no room. The space behind the panel can contain any 3D shapes — the only constraint is that they must be occluded or irrelevant from 0°.

---

## Acceptance criteria

- [ ] At `progress = 0`: visitor sees a clean flat composition — red rectangle, name, resume button. Looks 2D.
- [ ] At `progress ≈ 0.1`: 3D depth clearly visible — panel edge, shapes behind it, PBR shading.
- [ ] HTML (resume button) stays cleanly projected on the panel face throughout the orbit.
- [ ] `uLitness` transitions smoothly: flat look at rest, full PBR at mid-orbit.
- [ ] Panel edges invisible at rest — `#faf8f5` bg match must hold.
- [ ] Runs at 60fps on a mid-range laptop (stats panel in `bun dev`).

---

## File to implement

**`src/scenes/acts/act1/index.js`** — projection infrastructure is already wired. Add geometry only.

The stub already has:
- `projectorCamera` (cloned from main camera, frozen at 0°)
- `HtmlToCanvas` rasterizer pointed at `#page`
- `createProjector` patching meshes via `projector.applyTo(mesh)`
- `animate({ litness })` driving `uLitness`
- `placeOnFloor(mesh)` available from `utils/scene.js`

**What's missing:** the panel geometry, and optionally any backing geometry.

---

## Geometry to build

### 1. The panel (required)

```js
const panel = new THREE.Mesh(
  new THREE.BoxGeometry(16, 9, 0.15),
  new THREE.MeshStandardMaterial({ color: 0xfd453a })
)
panel.castShadow = true
panel.receiveShadow = true
placeOnFloor(panel, 4.5) // float at y=4.5 so it sits in the middle of the camera view
scene.add(panel)
projector.applyTo(panel)
```

`BoxGeometry` not `PlaneGeometry` — the 0.15 depth reveals the panel as a physical slab when orbiting. That moment of recognition is the illusion breaking.

### 2. Backing geometry (optional, Stage 1 discretion)

Any 3D shapes can go behind the panel (`z < 0`). They are invisible from 0° (occluded or lit flat), and visible on orbit. Use `placeOnFloor(mesh)` for anything that sits on the floor.

The only rules:
- Must not poke through the panel at 0°
- Must not give away depth when `uLitness = 0`

No walls. No ceiling. No room. Open scene with fog handling the far bounds.

---

## The anamorphic illusion

No shader tricks needed. The illusion is achieved by:

1. Panel filling most of the viewport at rest (camera at `z=12`, FOV 45°, panel 16×9)
2. Backing geometry at `z < 0` — behind the panel, occluded from the front
3. `uLitness = 0` at rest → pure flat HTML projected on the panel, no shading, no 3D cues
4. Background colour `#faf8f5` matches `#page` background → panel edges invisible

When the camera starts orbiting:
- Panel edge becomes visible (BoxGeometry depth)
- Backing geometry reveals from behind the panel
- `uLitness` ramps up → PBR shading kicks in
- Fog handles the open scene gracefully

---

## HUD (rotation arc indicator)

The `#hud` div in `index.html` is a stub. Stage 1 should show a minimal arc that appears once `progress > 0.02` and disappears at `progress < 0.01`. Communicates "you can scroll to orbit."

Simple implementation: a `<canvas>` inside `#hud`, draw an arc with `ctx.arc()` proportional to `progress`. Toggle `opacity` via CSS transition.

---

## index.html #page content

Resume button design is already in place. Check it reads clearly at projected resolution. Background (`#faf8f5`) must not be changed — must match `scene.threeScene.background`.

---

## Debug panel (lil-gui)

```js
if (import.meta.env.DEV) {
  import('lil-gui').then(({ default: GUI }) => {
    const gui = new GUI({ title: 'Act 1' })
    gui.add(panel.material, 'color')
    gui.add(projector.uniforms.uLitness, 'value', 0, 1, 0.01).name('litness (manual)')
  })
}
```

---

## What Stage 1 does NOT own

- Act 2 geometry (workspace, bridge) — stub only
- Act 3 geometry / DOM overlays — stub only
- Camera orbit math — defined in `Scene.js`, tune `ORBIT_WEIGHTS` in `config.js` if pacing feels wrong
- Scroll spacer height — `#scroll-spacer` in `style.css`
