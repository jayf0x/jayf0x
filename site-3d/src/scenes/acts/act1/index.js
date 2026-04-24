import * as THREE from 'three'
import HtmlToCanvas from '../../../utils/html-to-canvas.js'
import { createProjector } from '../../../utils/projected-material.js'
import { collectDocumentCss } from '../../../utils/collect-css.js'
import { placeOnFloor } from '../../../utils/scene.js'

/**
 * Act 1 — The Front Face
 *
 * A forced-perspective illusion. From the rest camera position (0°) the
 * scene reads as a perfectly flat red panel — a Malevich-style square with
 * a single "Download Resume" button projected onto it via HtmlToCanvas.
 *
 * Optical illusion: at 0° the scene is indistinguishable from a flat website.
 * Scrolling reveals the HTML was projected onto 3D geometry the whole time.
 *
 * uLitness = 0 at rest → flat, no shading, no depth cues.
 * uLitness = 1 at orbit → PBR lighting, panel edge visible, backing geometry revealed.
 * Panel edges invisible at rest because scene bg (#faf8f5) matches #page bg exactly.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * TODO (Stage 1) — implement the geometry:
 *
 *   1. Replace placeholder cube with the real panel:
 *        const panel = new THREE.Mesh(
 *          new THREE.BoxGeometry(16, 9, 0.15),
 *          new THREE.MeshStandardMaterial({ color: 0xfd453a })
 *        )
 *        panel.castShadow = true
 *        panel.receiveShadow = true
 *        placeOnFloor(panel, 4.5) // float at mid-camera view
 *        scene.add(panel)
 *        projector.applyTo(panel)
 *
 *   2. Optionally add any 3D backing geometry at z < 0 (behind the panel).
 *      It must be fully occluded at 0° and reveal naturally on orbit.
 *      No walls, no room — open scene, fog handles the far bounds.
 *      Use placeOnFloor(mesh) for anything on the floor.
 *
 *   3. Call projector.update() once after adding all meshes.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * @param {{ scene, camera, width, height }} params
 *   scene    — THREE.Scene to add objects to
 *   camera   — main camera (used to clone the projector camera)
 *   width    — viewport width (from renderer)
 *   height   — viewport height (from renderer)
 * @returns Act1 handle with animate() and onResize()
 */
export function buildAct1({ scene, camera, width, height }) {
  // ── Projector camera ──────────────────────────────────────────────────
  // Frozen at the rest position — never moves with the main camera.
  // This is what "paints" the HTML onto the panel geometry.
  const projectorCamera = camera.clone()
  projectorCamera.updateMatrixWorld()

  // ── HTML rasterizer ───────────────────────────────────────────────────
  const pageEl = document.getElementById('page')
  const htmlToCanvas = new HtmlToCanvas(pageEl, {
    width,
    height,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
  })

  // ── Projector ─────────────────────────────────────────────────────────
  const projector = createProjector({
    camera: projectorCamera,
    texture: htmlToCanvas.texture,
  })

  // Async: rasterize once fonts and stylesheets are ready
  ;(async () => {
    if (document.fonts?.ready) await document.fonts.ready
    htmlToCanvas.extraCss = await collectDocumentCss()
    await htmlToCanvas.update()
  })()

  // ── Panel ─────────────────────────────────────────────────────────────
  // BoxGeometry not PlaneGeometry — the 0.15 depth reveals the slab on orbit.
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(16, 9, 0.15),
    new THREE.MeshStandardMaterial({ color: 0xfd453a })
  )
  panel.name = 'act1-panel'
  panel.castShadow = true
  panel.receiveShadow = true
  placeOnFloor(panel, 4.5) // float so panel centre sits in camera FOV
  scene.add(panel)
  projector.applyTo(panel)

  // ── Backing geometry ──────────────────────────────────────────────────
  // Fully occluded at 0°, visible on orbit. Open scene — no walls, no room.

  // Wide back slab — catches panel shadow, reads as floor/rear plane on orbit
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(20, 10, 0.3),
    new THREE.MeshStandardMaterial({ color: 0xe8e0d8 })
  )
  back.position.set(0, 0, -12)
  placeOnFloor(back, 4.5)
  back.receiveShadow = true
  scene.add(back)

  // Left depth block — thin side wall, reveals depth on orbit
  const left = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 9, 12),
    new THREE.MeshStandardMaterial({ color: 0xd0c8be })
  )
  left.position.set(-8, 0, -6)
  placeOnFloor(left, 0.5)
  left.castShadow = true
  left.receiveShadow = true
  scene.add(left)

  // Right depth block — mirror of left
  const right = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 9, 12),
    new THREE.MeshStandardMaterial({ color: 0xd0c8be })
  )
  right.position.set(8, 0, -6)
  placeOnFloor(right, 0.5)
  right.castShadow = true
  right.receiveShadow = true
  scene.add(right)

  projector.update()

  return {
    projector,
    htmlToCanvas,

    /**
     * @param {{ litness: number }} frame
     *   litness — 0 at rest (flat HTML illusion), 1 at full orbit (3D lit)
     *             driven by Scene.js based on scroll progress
     */
    animate({ litness }) {
      projector.uniforms.uLitness.value = litness
    },

    onResize(width, height) {
      projectorCamera.aspect = width / height
      projectorCamera.updateProjectionMatrix()
      projector.update()

      htmlToCanvas.resize(width, height)
      htmlToCanvas.update()
    },

    dispose() {
      htmlToCanvas.dispose()
    },
  }
}
