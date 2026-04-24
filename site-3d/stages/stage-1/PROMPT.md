# Stage 1 — Agent Prompt

Read these files in order before touching any code:

1. `CLAUDE.md` — rules, structure, act interface, commit style
2. `src/ARCHITECTURE.md` — boot sequence, Scene.js internals, `placeOnFloor` util
3. `src/config.js` — all constants, import from here never hardcode
4. `stages/stage-1/DESIGN.md` — full spec and acceptance criteria for this stage
5. `src/scenes/acts/act1/backlog.md` — known issues

---

## Goal

Make the optical illusion work. From 0° orbit the scene must look like a flat 2D website. Orbit the camera and the scene clearly reveals 3D geometry with depth and lighting.

This stage is a proof-of-concept. Use placeholder blocks — exact shapes, textures, and polish come later. The illusion must work before you refine anything.

---

## What "the illusion" means

At rest (`progress = 0`, camera at `z = 12` looking at origin):
- A red panel fills most of the frame
- HTML (name + resume button) is projected flat onto the panel face
- `uLitness = 0` → no PBR shading, everything looks painted/flat
- Panel edges are invisible — `#faf8f5` background matches the `#page` background
- Any geometry behind the panel is completely hidden (occluded or merged into the flat look)

On orbit:
- Panel edge becomes visible (it's a thin BoxGeometry slab)
- `uLitness` rises → lighting kicks in, shadows appear
- 3D blocks placed behind the panel are now clearly visible
- The scene reads as a real 3D space

---

## What to build

### Step 1 — Replace the placeholder cube in `src/scenes/acts/act1/index.js`

The file currently has a 2×2×2 red cube at `(0, 0, 5)` with `placeOnFloor`. Replace it with the real panel:

```js
const panel = new THREE.Mesh(
  new THREE.BoxGeometry(16, 9, 0.15),
  new THREE.MeshStandardMaterial({ color: 0xfd453a })
)
panel.castShadow = true
panel.receiveShadow = true
placeOnFloor(panel, 4.5) // float panel so it sits in the middle of the camera FOV
scene.add(panel)
projector.applyTo(panel)
// projector.update() is already called after — don't duplicate it
```

### Step 2 — Place test blocks behind the panel

Add a handful of `BoxGeometry` blocks at `z < 0` (behind the panel) that:
- Are completely occluded at 0° (hidden behind the 16×9 panel)
- Clearly show 3D structure when the camera orbits to ~30–45°

These are placeholders. Positioning is the hard part — they must sit within the shadow of the panel at 0° but be visible on orbit.

A starting arrangement to try:

```js
// Back wall stand-in — a wide flat slab far behind the panel
const back = new THREE.Mesh(
  new THREE.BoxGeometry(20, 10, 0.3),
  new THREE.MeshStandardMaterial({ color: 0xe8e0d8 })
)
back.position.set(0, 0, -12)
placeOnFloor(back, 4.5) // match panel float height
back.receiveShadow = true
scene.add(back)

// Left depth block
const left = new THREE.Mesh(
  new THREE.BoxGeometry(0.3, 9, 12),
  new THREE.MeshStandardMaterial({ color: 0xd0c8be })
)
left.position.set(-8, 0, -6)
placeOnFloor(left, 0.5)
left.castShadow = true
left.receiveShadow = true
scene.add(left)

// Right depth block (mirror)
const right = left.clone()
right.position.set(8, 0, -6)
scene.add(right)
```

These exact shapes are not precious. Move them, resize them, add more — whatever makes the illusion read clearly on orbit. The test is: does it look flat from 0°? Does it clearly look 3D from 30°?

### Step 3 — Verify `uLitness` is doing the right thing

The `animate({ litness })` method already drives `uLitness`. No changes needed there. But visually confirm:
- At `progress = 0`: panel looks flat, same as a screenshot of the HTML
- At `progress = 0.1–0.2`: shading kicks in on the panel and blocks

If it looks wrong, check `ORBIT_WEIGHTS` in `config.js` — the `litness` value depends on scroll progress.

---

## Acceptance criteria

- [ ] At `progress = 0`: scene looks like a flat red square with the HTML site on it. Cannot tell it is 3D.
- [ ] At `progress ≈ 0.1`: panel edge visible, blocks behind clearly 3D, shadows/lighting visible.
- [ ] Panel edges invisible at rest — `#faf8f5` must match exactly, check in browser.
- [ ] HTML projection is clean at rest (no distortion, no bleeding onto side faces).
- [ ] 60fps maintained (stats panel).
- [ ] No console errors.

---

## Do NOT

- Build real geometry (no textures, no fine-tuned shapes, no materials beyond flat colours)
- Touch `src/core/` or `src/utils/`
- Add packages (`bun add` is off-limits this stage)
- Hardcode scroll thresholds — import from `src/config.js`
- Add `console.log` in the render loop
- Worry about Act 2 or Act 3 — this file only

---

## Commit style

```
act1: panel geometry + test blocks for depth illusion
```
