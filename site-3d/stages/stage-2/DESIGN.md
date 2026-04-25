# Stage 2 — Act 2 Implementation Notes

> Concept and design decisions live in root `DESIGN.md → Act 2`. Read that first.
> Known issues and open questions live in `stages/stage-2/backlog.md`.

---

## Iteration 1 scope

Goal: cube wall visible at 90°. At least one cube interactive.

- [ ] Cube wall visible from 90° camera position (`x = 12, y = 1.8, z = 0`)
- [ ] Cubes are on the floor — no floating (use `placeOnFloor`)
- [ ] At least one cube changes on hover or opens a URL on click

---

## File to implement

**`src/scenes/acts/act2/index.js`** — currently a stub.

---

## Cube wall layout

The camera at 90° sits at `(12, 1.8, 0)` looking at origin. The cube wall should be visible from this position — place cubes in the range `x ∈ [-3, 3]`, `z ∈ [-4, 4]`, varying heights.

```js
import { placeOnFloor } from '../../../utils/scene.js'

const sizes = [
  [1.5, 2, 1.5], [2, 3, 2], [1, 1.5, 1], [2.5, 4, 2], [1.5, 2.5, 1.5],
  [3, 1.5, 2],   [1, 3, 1], [2, 2, 2.5], [1.5, 1, 1.5],
]
const positions = [
  [-2, 0, -2], [0, 0, -1], [2, 0, -3], [-1, 0, 1], [1, 0, 2],
  [-3, 0, 0],  [3, 0, -1], [0, 0, 3],  [2, 0, 0],
]

sizes.forEach(([w, h, d], i) => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.6 })
  )
  mesh.position.set(...positions[i])
  placeOnFloor(mesh)
  mesh.castShadow = true
  mesh.receiveShadow = true
  scene.add(mesh)
})
```

Tweak positions and sizes freely — the layout just needs to read as a dense formation from the 90° camera angle.

---

## Project cubes (textured)

Some cubes display a project screenshot. Apply a texture to one face:

```js
const loader = new THREE.TextureLoader()
const tex = loader.load('/projects/piipaya.png')
tex.colorSpace = THREE.SRGBColorSpace

const materials = Array(6).fill(null).map(() =>
  new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.6 })
)
materials[4] = new THREE.MeshStandardMaterial({ map: tex }) // front face

const projectCube = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), materials)
projectCube.userData.url = 'https://github.com/...'
placeOnFloor(projectCube)
scene.add(projectCube)
```

Textures go in `public/projects/`. See `user-info/about.md` for the project list and URLs.

---

## Raycasting (click to open)

```js
const raycaster = new THREE.Raycaster()
const projectCubes = [/* textured cubes only */]

// Inside animate({ input }) — camera is passed from Scene.js as buildAct2({ scene, camera })
if (input.clicked) {
  raycaster.setFromCamera(input.clickNdc, camera)
  const hits = raycaster.intersectObjects(projectCubes)
  if (hits.length > 0) {
    const url = hits[0].object.userData.url
    if (url) window.open(url, '_blank', 'noopener')
  }
}
```

---

## Hover state (optional for Iteration 1)

```js
// Inside animate({ input })
raycaster.setFromCamera(input.ndc, camera)
const hovered = raycaster.intersectObjects(projectCubes)
projectCubes.forEach(c => {
  c.material[4].emissive.setHex(0x000000)
})
if (hovered.length > 0) {
  hovered[0].object.material[4].emissive.setHex(0x222222)
}
```

---

## Bridge (Icebox — do not build)

The bridge concept (career arc, pillars per employer, "Your logo here" banner) is in the icebox. Do not build it. If the scene feels empty in the -x direction, add a few extra tall cubes to fill the fog distance.

---

## What Stage 2 does NOT own

- Panel, HTML projection — Act 1
- Camera orbit math — `Scene.js` + `config.js`
- Monolith, GPT-1 — Act 3
