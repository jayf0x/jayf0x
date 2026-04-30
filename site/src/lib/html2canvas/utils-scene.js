// Not used in the R3F slab layout — retained for reference.
// placeOnFloor is a vanilla Three.js scene helper; our layout engine
// positions nodes via slabLayout.ts instead.

import * as THREE from 'three'

const _box = new THREE.Box3() // reused — no per-call allocation

/**
 * Translates `object.position.y` so the bounding-box floor sits at `y = offset`.
 *
 * - `placeOnFloor(mesh)`         → bottom at y = 0  (default, floor-level)
 * - `placeOnFloor(mesh, 0.5)`    → bottom floats 0.5 m above the floor
 *
 * Call after setting x/z but before (or after) adding to the scene.
 * Only valid when the object has no parent transform.
 *
 * Use for every scene object. Pass an explicit offset for anything that
 * intentionally floats — never hardcode a y position instead.
 *
 * @param {THREE.Object3D} object
 * @param {number} [offset=0]  distance above y=0 for the object's bottom face
 */
export function placeOnFloor(object, offset = 0) {
  _box.setFromObject(object)
  object.position.y -= _box.min.y - offset
}
