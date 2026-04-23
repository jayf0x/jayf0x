# Stage 2 — Act 2: The Workspace + The Bridge

> Read `CLAUDE.md` and `DESIGN.md` first, then this file.

**Goal:** Two things emerge as the camera orbits: a lived-in workspace in the foreground (clickable project cubes), and a monumental bridge under construction in the background (atmosphere, career arc).

---

## Acceptance criteria

- [ ] At least 3 project cubes visible in the workspace zone, each with a texture
- [ ] Clicking / tapping a cube opens the project URL in a new tab
- [ ] Bridge is visible in the background with at least 2 distinct pillars
- [ ] Bridge recedes into fog — back end dissolves, doesn't hard-clip
- [ ] "Your logo here" banner visible at the far end
- [ ] Cursor effect activates when `progress ∈ [0.15, 0.85]`
- [ ] 60fps maintained (check stats panel)

---

## File to implement

**`src/scenes/acts/act2.js`** — currently a stub with TODOs. Implement `buildAct2`.

---

## Part 1 — The Workspace

### Project cubes

Each project = one low-poly display object. A `BoxGeometry` cube with one face showing a screenshot or GIF texture is enough. Keep the other faces plain white or near-white.

```js
// Texture loading
const loader = new THREE.TextureLoader()
const tex = loader.load('/projects/piipaya.png')
tex.colorSpace = THREE.SRGBColorSpace

// Face-specific texture: apply different materials per face
const materials = [
  new THREE.MeshStandardMaterial({ color: 0xf5f5f5 }), // right
  new THREE.MeshStandardMaterial({ color: 0xf5f5f5 }), // left
  new THREE.MeshStandardMaterial({ color: 0xf5f5f5 }), // top
  new THREE.MeshStandardMaterial({ color: 0xf5f5f5 }), // bottom
  new THREE.MeshStandardMaterial({ map: tex }),         // front ← textured face
  new THREE.MeshStandardMaterial({ color: 0xf5f5f5 }), // back
]

const cube = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), materials)
```

Place cubes scattered around the origin — visible from the 90° camera at `(12, 0, 0)`. Roughly `x ∈ [-4, 4]`, `z ∈ [-4, 4]`. Vary rotation slightly for a "dumped on the floor" feel. Keep well clear of `x < -15` (that's bridge territory).

### Project texture assets

Place in `public/projects/`. Filenames and source URLs:

| File | Project | URL to open on click |
|------|---------|---------------------|
| `piipaya.png` or `.gif` | PIIPAYA | `https://github.com/jayf0x/PIIPAYA/` |
| `pure-paste.png` | Pure-Paste | `https://github.com/jayf0x/Pure-Paste` |
| `fluidity.png` | Fluidity-js | `https://github.com/jayf0x/fluidity` |

Use `user-info/about.md` for the full project list. Add more cubes as assets are available.

### Raycasting (click to open)

```js
const raycaster = new THREE.Raycaster()
const projectMeshes = [cube1, cube2, cube3]
const projectUrls = { [cube1.uuid]: 'https://...', ... }

// Inside animate({ input, camera }) — camera is passed from Scene.js
if (input.clicked) {
  raycaster.setFromCamera(input.clickNdc, camera)
  const hits = raycaster.intersectObjects(projectMeshes)
  if (hits.length > 0) {
    window.open(projectUrls[hits[0].object.uuid], '_blank', 'noopener')
  }
}
```

Note: `camera` must be passed into `buildAct2`. Update `Scene.js` call: `buildAct2({ scene, camera })`.

### Cursor effect

`ideas/cursor-effect-01.js` — 3D noise lines that follow the pointer and circle like sharks when idle. Read the file before integrating (don't copy blindly — adapt to work with the Three.js scene and the RAF loop).

Activate only when `progress ∈ [0.15, 0.85]` to avoid interfering with Act 1 and Act 3 views.

---

## Part 2 — The Bridge

### Orbit geometry — read before placing anything

At 90° orbit the camera is at `(ORBIT_RADIUS, 0, 0) = (12, 0, 0)`, looking toward the origin `(0, 0, 0)`. The sight-line extends along the **-X axis**. Objects at large negative X appear in the far distance (like a mountain range on the horizon).

Bridge and distant elements go at **negative X** — not at negative Z. The workspace cubes cluster near the origin.

### Concept

A dark rocky mass looming along the -X axis. In fog. Not architectural detail — read as a desolate mountain range from the 90° orbit position. Each "peak" or formation = one work experience. Scale is key.

The fog (`FogExp2, density 0.022`) handles atmospheric falloff. Anything beyond `-x ≈ 40` dissolves.

Phase 0 stand-in (already in `act2.js`):
```js
// Dark blue slab at x = -30, seen as a distant mountain from the 90° camera
const bridge = new THREE.Mesh(
  new THREE.BoxGeometry(60, 35, 20),
  new THREE.MeshStandardMaterial({ color: 0x0d1f3c })
)
bridge.position.set(-30, 17.5, 0)
```

### Pillars / rock formations (Stage 2 real geometry)

One formation per work experience. Start with Bricsys. Stack BoxGeometry slabs at varying heights and slight offsets — the fog eats the detail, so silhouette is what matters.

```js
const footBase = new THREE.Mesh(
  new THREE.BoxGeometry(4, 12, 4),
  new THREE.MeshStandardMaterial({ color: 0x0d1f3c })
)
footBase.position.set(-25, 6, 0)
```

Place formations along the -X axis, spreading slightly in Z for depth: `x ∈ [-20, -50]`, `z ∈ [-10, 10]`.

### Bridge deck + unfinished end

A thin horizontal slab at large negative X. Ends abruptly — visually cut off.

### "Your logo here" banner

At the far end of the formation cluster (`x ≈ -50`):

```js
const canvas = document.createElement('canvas')
canvas.width = 1024; canvas.height = 256
const ctx = canvas.getContext('2d')
ctx.fillStyle = '#ffffff'
ctx.fillRect(0, 0, 1024, 256)
ctx.fillStyle = '#aaaaaa'
ctx.font = 'bold 64px sans-serif'
ctx.textAlign = 'center'
ctx.fillText('YOUR LOGO HERE', 512, 160)
const bannerTex = new THREE.CanvasTexture(canvas)

const banner = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 3),
  new THREE.MeshBasicMaterial({ map: bannerTex })
)
banner.position.set(-50, 8, 0) // far end of the -X formation cluster
banner.rotation.y = Math.PI / 2  // face +X so camera at 90° can read it
```

`MeshBasicMaterial` so the banner reads clearly even in low-light fog.

---

## Lighting additions for Act 2

The existing key + fill lights from Scene.js are a starting point. For workspace drama:

- Consider a point light above the workspace area (`y = 8, z = -8`) casting long shadows on the floor
- Bridge can be dimmer / more atmospheric — the fog does most of the work

---

## What Stage 2 does NOT own

- Panel, walls, projector — Act 1 code, don't touch
- Camera keyframes — in `Scene.js`. If orbit feels wrong for Act 2 reveal, adjust there.
- GPT-1 terminal, editor — Act 3
