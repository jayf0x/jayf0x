import * as THREE from 'three'
import { ORBIT_RADIUS } from '../../../config.js'
import { placeOnFloor } from '../../../utils/scene.js'

/**
 * Act 3 — The Monolith
 *
 * The camera snaps to a white void. A tall dark slab — the Monolith — stands
 * at centre. Its face displays Jonatan's files via a DOM overlay. A single-
 * question chat at the bottom speaks in the voice of GPT-1.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * TODO (Stage 3) — POC scope:
 *
 *   1. Monolith geometry:
 *      - BoxGeometry(1.5, 4, 0.15), dark material, position (0, 0, -8)
 *      - Rough material visual refinement is post-POC
 *
 *   2. DOM overlay (#monolith-overlay):
 *      - Tabs: resume.md | info.md | late-night-claude.md
 *      - File content (markdown via `marked`)
 *      - Download button per file
 *      - Show/hide via inAct3 flag
 *
 *   3. GPT-1 chat:
 *      - Single-question input (not a conversation)
 *      - Lazy-load model on first submit via Transformers.js
 *      - Progress bar during model download
 *      - Token counter (chars / 4 estimate), reset button
 *      - Oracle framing prefix (see stages/stage-3/DESIGN.md Part 3)
 *
 *   4. Act 4 trigger:
 *      - import { initAct4 } from '../../act4/report.js'
 *      - Call act4.trigger({ actReached: 3 }) on first GPT-1 message (once)
 *
 * See stages/stage-3/DESIGN.md for full spec.
 * Lighting, textures, floor, transitions — post-POC.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * @param {{ scene: THREE.Scene, camera: THREE.Camera }} params
 * @returns Act3 handle with animate() and dispose()
 */
export function buildAct3({ scene, camera }) {
  // Phase 0 monolith stand-in — 2001: A Space Odyssey slab.
  // Stands on the floor directly in front of the 180° camera position.
  // Replace in Stage 3 with real monolith geometry + DOM overlay.
  const monolith = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 4, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x050505 })
  )
  monolith.name = 'act3-monolith'
  monolith.position.set(0, 0, -ORBIT_RADIUS + 4) // z = −8, 4 m in front of locked camera
  placeOnFloor(monolith)
  scene.add(monolith)

  return {
    /**
     * @param {{ delta, elapsed, progress, input, inAct3: boolean }} frame
     *   inAct3 — true when Scene.js has snapped camera to Act 3 position.
     *             Use this to show/hide the monolith overlay.
     */
    animate({ delta, elapsed, progress, input, inAct3 }) {
      // TODO (Stage 3): show/hide overlay based on inAct3
    },

    dispose() {
      // TODO (Stage 3 / post-launch): hide overlay, dispose geometry
      // NOTE: Transformers.js model cannot be fully unloaded — see backlog.md
    },
  }
}
