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
 * As the camera orbits away from 0°, the panel reveals its physical depth
 * (it's a thin BoxGeometry slab) and the gallery behind it comes into view.
 *
 * The HTML texture is always projected from the rest position, so the
 * design on the panel looks "painted on" as the camera moves around it.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * TODO (Stage 1) — implement the geometry:
 *
 *   1. Create the red panel:
 *        const panel = new THREE.Mesh(
 *          new THREE.BoxGeometry(16, 9, 0.15),
 *          new THREE.MeshStandardMaterial({ color: 0xfd453a })
 *        )
 *        panel.castShadow = true
 *        panel.receiveShadow = true
 *        scene.add(panel)
 *        projector.applyTo(panel)
 *
 *   2. Build surrounding geometry that is invisible from 0° but reveals
 *      the gallery room as the camera orbits (walls, floor, ceiling).
 *      Keep geometry behind / beside the panel — z < 0.
 *
 *   3. The anamorphic trick: objects placed precisely so they align with
 *      the panel silhouette at exactly 0°. Can be purely spatial — no
 *      shader tricks needed. Place objects behind the panel at angles
 *      that make them invisible when occluded head-on.
 *
 *   4. Call projector.update() once after adding all meshes.
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

  // Phase 0 placeholder — 2×2×2 red cube, bottom at y=0 (floor level)
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshStandardMaterial({ color: 0xff2200 })
  )
  cube.name = 'act1-cube'
  cube.position.set(0, 0, 5)
  placeOnFloor(cube)
  scene.add(cube)
  projector.applyTo(cube)
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
