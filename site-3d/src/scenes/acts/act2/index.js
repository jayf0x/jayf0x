import * as THREE from 'three'
import { placeOnFloor } from '../../../utils/scene.js'

/**
 * Act 2 — The Cube Formation
 *
 * Dense mass of rectangular blocks visible from the 90° camera position
 * (x=12, y=1.8, z=0). From 0° they sit behind the Act 1 panel.
 *
 * Project cubes expose their +x face (material index 0) toward the camera.
 * Clicking a project cube opens its URL.
 */
export function buildAct2({ scene, camera }) {
  const loader = new THREE.TextureLoader()
  const raycaster = new THREE.Raycaster()
  const projectMeshes = []

  function baseMat() {
    return new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.7 })
  }

  function addCube([w, h, d], [x, , z]) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), baseMat())
    mesh.position.set(x, 0, z)
    placeOnFloor(mesh)
    mesh.castShadow = true
    mesh.receiveShadow = true
    scene.add(mesh)
    return mesh
  }

  function addProjectCube([w, h, d], [x, , z], texPath, url) {
    const tex = loader.load(texPath)
    tex.colorSpace = THREE.SRGBColorSpace

    // Index 0 = +x face — points toward the 90° camera at (12, 1.8, 0)
    const mats = Array(6).fill(null).map(baseMat)
    mats[0] = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 })

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats)
    mesh.position.set(x, 0, z)
    placeOnFloor(mesh)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData.url = url
    scene.add(mesh)
    projectMeshes.push(mesh)
    return mesh
  }

  // ── Foreground — small cubes at the panel shadow edge ──────────────────
  addCube([0.8, 1.2, 0.8], [-3, 0, -1.5])
  addCube([1.0, 0.8, 1.0], [ 2, 0, -1.2])
  addCube([0.9, 1.5, 0.9], [-1, 0, -1.8])

  // ── Mid-ground — plain cubes ────────────────────────────────────────────
  addCube([2,   3,   1.5], [-2, 0, -4  ])
  addCube([2.5, 2,   2  ], [ 2, 0, -3.5])
  addCube([2,   2.5, 2  ], [ 3, 0, -5  ])

  // ── Mid-ground — project cubes (tallest three) ──────────────────────────
  addProjectCube(
    [1.5, 5, 1.5], [0, 0, -4],
    '/projects/piipaya.png',
    'https://github.com/jayf0x/PIIPAYA/'
  )
  addProjectCube(
    [1.5, 4, 1.5], [-3.5, 0, -5],
    '/projects/pure-paste.png',
    'https://github.com/jayf0x/Pure-Paste'
  )
  addProjectCube(
    [3, 4, 3], [-1, 0, -9],
    '/projects/fluidity.png',
    'https://github.com/jayf0x/fluidity'
  )

  // ── Far background — large masses disappearing into fog ─────────────────
  addCube([2.5, 3, 2.5], [ 2, 0, -8 ])
  addCube([4,   5, 3  ], [-3, 0, -11])

  return {
    animate({ input }) {
      if (input.clicked && input.clickNdc) {
        raycaster.setFromCamera(input.clickNdc, camera)
        const hits = raycaster.intersectObjects(projectMeshes)
        if (hits.length > 0) {
          const url = hits[0].object.userData.url
          if (url) window.open(url, '_blank', 'noopener')
        }
      }
    },

    dispose() {
      projectMeshes.forEach(m => {
        m.geometry.dispose()
        m.material.forEach(mat => {
          if (mat.map) mat.map.dispose()
          mat.dispose()
        })
      })
    },
  }
}
