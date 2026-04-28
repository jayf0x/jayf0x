# Stage 2 — Act 2 Implementation Notes

> Concept and design decisions live in root `DESIGN.md → Act 2`. Read that first.
> Known issues and open questions live in `src/scenes/acts/act2/backlog.md`.

---

## Iteration 1 scope

Goal: snow globe visible, physics running, at least one project panel clickable.

- [ ] Globe boundary visible from 90° camera position (`x = 12, y = 1.8, z = 0`)
- [ ] Rapier world initialised with reduced gravity
- [ ] At least two chess piece models inside the globe, not overlapping
- [ ] Snow particles spawning and falling
- [ ] At least one project panel clickable (opens URL)

---

## File to implement

**`src/scenes/acts/act2/index.js`** — currently has a cube-wall placeholder. Replace with snow globe.

---

## Dependency

```bash
bun add @dimforge/rapier3d-compat
```

Rapier uses WASM. Import via:

```js
import RAPIER from '@dimforge/rapier3d-compat'
await RAPIER.init()
const world = new RAPIER.World({ x: 0, y: -1, z: 0 })  // reduced gravity
```

Initialise inside an async IIFE; proceed to add geometry once `world` is ready.

---

## Part 1 — Globe boundary

Invisible collider sphere. Radius 5 (world units = metres).

```js
const GLOBE_RADIUS = 5
const GLOBE_CENTER = new THREE.Vector3(0, GLOBE_RADIUS, 0)  // sits on floor

// Visual (optional transparent shell for Iteration 1 — or skip entirely)
// Rapier collider: ball collider on a fixed rigid body at GLOBE_CENTER
const globeBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(...GLOBE_CENTER)
const globeBody = world.createRigidBody(globeBodyDesc)
const globeColliderDesc = RAPIER.ColliderDesc.ball(GLOBE_RADIUS)
  .setRestitution(0.3)
world.createCollider(globeColliderDesc, globeBody)
```

For Iteration 1 a faint wireframe sphere is fine as the visual boundary.

---

## Part 2 — Terrain (low-poly floor inside globe)

Simple `PlaneGeometry` displaced at spawn positions, or a flat floor at `y = 0` with a few low-poly rock/mound meshes. Keep it minimal for Iteration 1.

```js
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(GLOBE_RADIUS - 0.2, 8),
  new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.9 })
)
floor.rotation.x = -Math.PI / 2
floor.position.copy(GLOBE_CENTER)
floor.position.y = 0.01  // just above world floor
scene.add(floor)

// Rapier floor collider
const floorBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0, 0)
const floorBody = world.createRigidBody(floorBodyDesc)
world.createCollider(RAPIER.ColliderDesc.cuboid(GLOBE_RADIUS, 0.05, GLOBE_RADIUS), floorBody)
```

---

## Part 3 — Props (chess pieces + TV)

Load GLTF models, scale to target height, add Rapier capsule or cuboid colliders. Mathematical spawn positions avoid overlap — no need for manual distance checks.

```js
// Spawn positions (inside globe, well-separated)
const PROP_SPAWNS = [
  { x: -1.5, z: -1.0 },
  { x:  1.5, z: -1.5 },
  { x:  0.0, z:  1.5 },
  { x: -2.0, z:  1.5 },
  { x:  2.0, z:  1.0 },
]

// After loading and scaling a model, create a matching Rapier cuboid rigid body:
function addPropPhysics(world, position, halfExtents) {
  const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(position.x, position.y, position.z)
    .setLinearDamping(0.8)
    .setAngularDamping(0.9)
  const body = world.createRigidBody(bodyDesc)
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(...halfExtents).setRestitution(0.1),
    body
  )
  return body
}
```

Sync Three.js mesh position/rotation to Rapier body each frame:
```js
mesh.position.copy(body.translation())
mesh.quaternion.copy(body.rotation())
```

---

## Part 4 — Snow particles

Small sphere rigid bodies. Spawn at random positions near the top of the globe. Sleep when velocity is near zero (`world.integrationParameters.allowedLinearError` controls this — default is fine).

```js
const SNOW_RADIUS = 0.04
const MAX_SNOW = 200
const snowMeshes = []
const snowBodies = []

function spawnSnowflake() {
  if (snowMeshes.length >= MAX_SNOW) return
  const angle = Math.random() * Math.PI * 2
  const r = Math.random() * (GLOBE_RADIUS - 1)
  const x = GLOBE_CENTER.x + Math.cos(angle) * r
  const z = GLOBE_CENTER.z + Math.sin(angle) * r
  const y = GLOBE_CENTER.y + GLOBE_RADIUS * 0.7  // near top

  const mesh = new THREE.Mesh(snowGeo, snowMat)
  mesh.position.set(x, y, z)
  scene.add(mesh)

  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(x, y, z)
      .setLinearDamping(0.5)
  )
  world.createCollider(RAPIER.ColliderDesc.ball(SNOW_RADIUS).setRestitution(0.05), body)

  snowMeshes.push(mesh)
  snowBodies.push(body)
}
```

In `animate()`: step the world, sync meshes, spawn one flake per frame until MAX_SNOW.

```js
world.step()
snowBodies.forEach((body, i) => {
  snowMeshes[i].position.copy(body.translation())
})
```

---

## Part 5 — Project panels

Flat `PlaneGeometry` panels mounted on the inner surface of the globe, facing inward (toward center). One per project. Use `TextureLoader` for project screenshot textures. Raycaster for click-to-open.

```js
const PROJECTS = [
  { tex: '/projects/piipaya.png',    url: 'https://github.com/jayf0x/PIIPAYA/' },
  { tex: '/projects/pure-paste.png', url: 'https://github.com/jayf0x/Pure-Paste' },
  { tex: '/projects/fluidity.png',   url: 'https://github.com/jayf0x/fluidity' },
]

// Mount panels at globe equator, evenly spaced in angle
PROJECTS.forEach((p, i) => {
  const angle = (i / PROJECTS.length) * Math.PI * 2
  const x = GLOBE_CENTER.x + Math.sin(angle) * (GLOBE_RADIUS - 0.1)
  const z = GLOBE_CENTER.z + Math.cos(angle) * (GLOBE_RADIUS - 0.1)
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 1),
    new THREE.MeshStandardMaterial({ map: texLoader.load(p.tex) })
  )
  panel.position.set(x, GLOBE_CENTER.y, z)
  panel.lookAt(GLOBE_CENTER)     // face inward
  panel.userData.url = p.url
  scene.add(panel)
  projectPanels.push(panel)
})
```

---

## Part 6 — Animate loop

```js
animate({ input, delta }) {
  world.step()

  // sync snow
  snowBodies.forEach((b, i) => snowMeshes[i].position.copy(b.translation()))

  // sync props
  propBodies.forEach((b, i) => {
    propMeshes[i].position.copy(b.translation())
    propMeshes[i].quaternion.copy(b.rotation())
  })

  // spawn snow (rate limited)
  if (elapsed % 0.1 < delta) spawnSnowflake()

  // click → open project
  if (input.clicked && input.clickNdc) {
    raycaster.setFromCamera(input.clickNdc, camera)
    const hits = raycaster.intersectObjects(projectPanels)
    if (hits.length > 0 && hits[0].object.userData.url) {
      window.open(hits[0].object.userData.url, '_blank', 'noopener')
    }
  }
}
```

---

## What Stage 2 does NOT own

- Panel, HTML projection — Act 1
- Camera orbit math — `Scene.js` + `config.js`
- Monolith, GPT-1 — Act 3
