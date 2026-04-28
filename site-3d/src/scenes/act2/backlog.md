# Act 2 Backlog

## Phase 0 (done — cube wall placeholder)
- [x] Cube formation placeholder with chess pieces + TV (GLTF)
- [x] Project cubes with textured +x face
- [x] Click-to-open raycaster wired

> Phase 0 placeholder is a cube wall. Stage 2 replaces this with the snow globe.

---

## Stage 2 TODOs (snow globe)

### Iteration 1
- [ ] Add `@dimforge/rapier3d-compat` dependency
- [ ] Rapier world with reduced gravity (`y = -1`)
- [ ] Invisible sphere collider as globe boundary (radius 5)
- [ ] Low-poly flat terrain / floor inside globe
- [ ] Chess pieces + TV loaded as GLTF, each with a Rapier cuboid collider
- [ ] Mathematical spawn positions from `PROP_SPAWNS` array (no manual overlap)
- [ ] Snow particles (tiny sphere rigid bodies, max 200, spawn rate limited)
- [ ] Project panels on inner globe face, evenly spaced by angle
- [ ] Click-to-open raycaster on project panels
- [ ] Sync Three.js meshes to Rapier bodies each frame in `animate()`
- [ ] `dispose()` cleans up Rapier world and all meshes

### Iteration 2
- [ ] Frosted glass boundary shader on globe sphere
- [ ] Shake gesture: impulse applied to all rigid bodies when scroll velocity spikes
- [ ] Terrain: low-poly mound meshes, not just a flat circle
- [ ] Snow accumulation visual: sleeping snowballs stay put, render as flat disc
- [ ] Hover highlight on project panels
- [ ] Lighting: single dramatic directional light from above

---

## Known issues
- Current code is the Phase 0 cube wall — needs full replacement for Stage 2
- Rapier WASM init is async; act must handle the delay gracefully (show nothing or show a loading state until world is ready)
- Rapier `ColliderDesc.ball` on a fixed body does NOT act as a container by default — use an inward-facing hollow sphere or a set of inner-surface planes to keep objects inside
