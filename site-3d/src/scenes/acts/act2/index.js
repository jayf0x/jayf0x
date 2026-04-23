import * as THREE from 'three'
import { placeOnFloor } from '../../../utils/scene.js'

/**
 * Act 2 — The Workspace + The Bridge
 *
 * As the camera orbits past Act 1 (90° position), two things emerge:
 *
 * ── Foreground: The Workspace ──────────────────────────────────────────────
 * A lived-in creative space. Low-poly objects with project screenshots or
 * GIFs mapped as textures. Each is clickable — raycasting via input.clicked.
 *
 * ── Background: The Bridge ────────────────────────────────────────────────
 * Far outside the orbit circle along the −x axis: a massive bridge/cliff
 * formation that looms in the fog like a mountain range.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * TODO (Stage 2):
 *   - Project cubes with PNG textures from /public/projects/
 *   - On click: window.open(projectUrl, '_blank')
 *   - Cursor-effect-01 integration
 *   - Procedural bridge geometry (pillars, arches, deck)
 *   - Per-pillar company branding
 *   - "Your logo here" banner at far end
 * ─────────────────────────────────────────────────────────────────────────
 *
 * @param {{ scene: THREE.Scene, camera: THREE.Camera }} params
 * @returns Act2 handle with animate()
 */
export function buildAct2({ scene, camera }) {
  // Workspace stand-in — centred at origin, bottom at y=0.
  // At 90° orbit the camera is at (ORBIT_RADIUS, EYE_HEIGHT, 0) looking at origin.
  const workspace = new THREE.Mesh(
    new THREE.BoxGeometry(6, 6, 6),
    new THREE.MeshStandardMaterial({ color: 0x4488ff })
  )
  workspace.name = 'act2-workspace'
  workspace.position.set(0, 0, 0)
  placeOnFloor(workspace)
  scene.add(workspace)

  // Bridge / rock formation — far outside the orbit circle on the −x axis.
  // When camera is at 90° (x=+12) looking at origin, the sight-line continues
  // to −x, placing this formation as a distant mountain range in the frame.
  // Positioned at x=−65 (~5× the orbit radius) to feel genuinely distant.
  const bridge = new THREE.Mesh(
    new THREE.BoxGeometry(80, 50, 25),
    new THREE.MeshStandardMaterial({ color: 0x0d1f3c })
  )
  bridge.name = 'act2-bridge'
  bridge.position.set(-65, 0, 0)
  placeOnFloor(bridge)
  scene.add(bridge)

  const raycaster = new THREE.Raycaster()
  const clickables = [workspace]

  return {
    animate({ delta, elapsed, progress, input }) {
      if (input.clicked && input.clickNdc) {
        raycaster.setFromCamera(input.clickNdc, camera)
        const hits = raycaster.intersectObjects(clickables)
        if (hits.length > 0) {
          // TODO (final QA step): re-enable this log to verify raycasting works
          // console.log('[Act 2] clicked:', hits[0].object.name)
        }
      }
    },

    dispose() {
      // TODO (post-launch): dispose workspace + bridge geometry/materials
    },
  }
}
