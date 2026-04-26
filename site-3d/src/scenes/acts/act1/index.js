import * as THREE from 'three'
import HtmlToCanvas from '../../../utils/html-to-canvas.js'
import { createProjector } from '../../../utils/projected-material.js'
import { collectDocumentCss } from '../../../utils/collect-css.js'
import { placeOnFloor } from '../../../utils/scene.js'

/**
 * Act 1 — The Front Face (cube illusion)
 *
 * From 0° the scene reads as a perfectly flat website. The HTML is projected
 * from a frozen camera onto a cluster of rectangular blocks at varying z-depths.
 * Tiled flush across the viewport so no gaps break the illusion.
 *
 * Orbit reveal: scrolling pulls the camera sideways and the "flat" surface
 * shatters into a dense stack of 3D cuboids with wildly different depths.
 *
 * uLitness = 0 → flat projected texture, no shading cues
 * uLitness = 1 → full PBR lighting, depth stagger fully readable
 */
export function buildAct1({ scene, camera, width, height }) {
  // ── Projector camera ──────────────────────────────────────────────────
  // Frozen at the rest position. Never moves. Paints the HTML onto geometry.
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

  ;(async () => {
    if (document.fonts?.ready) await document.fonts.ready
    htmlToCanvas.extraCss = await collectDocumentCss()
    await htmlToCanvas.update()
  })()

  // ── Cube layout ───────────────────────────────────────────────────────
  // All cubes receive the projection. From 0° they form one flat surface.
  // Depth (z) varies per cube — that's the illusion. The projection is
  // perspective-correct so z-stagger is invisible at rest.
  //
  // Front row: four 4-wide cubes tiling x −8 → 8 with no gap.
  // Additional cubes behind add mass + drama on orbit.

  const mat = () => new THREE.MeshStandardMaterial({ color: 0xfaf8f5, roughness: 0.75 })

  function addBlock(w, h, d, x, z) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat())
    mesh.position.set(x, 0, z)
    placeOnFloor(mesh)
    mesh.castShadow = true
    mesh.receiveShadow = true
    scene.add(mesh)
    projector.applyTo(mesh)
    return mesh
  }

  // Front row — flush tiles, each at a different depth.
  // Width 4 each, centers at -6, -2, 2, 6  →  spans x: -8 to 8.
  addBlock(4,  8.0, 0.8,  -6,  0.0)   // far left — shallowest
  addBlock(4,  9.5, 1.8,  -2, -0.8)   // centre-left — mid depth, tallest
  addBlock(4,  9.0, 2.2,   2, -1.8)   // centre-right — deeper
  addBlock(4,  7.5, 1.2,   6, -3.0)   // far right — deepest

  // Second layer — emerges from behind the front row on orbit.
  addBlock(3.0, 7.0, 2.0,  -5, -4.5)
  addBlock(3.5, 5.5, 2.5,   0, -5.0)
  addBlock(3.0, 6.0, 2.0,   5, -4.0)

  // Far background — large mass that bleeds into the fog.
  addBlock(5.0, 4.0, 3.0,  -2, -9.0)
  addBlock(4.0, 5.0, 3.5,   4, -10.0)

  projector.update()

  return {
    projector,
    htmlToCanvas,

    animate({ litness }) {
      projector.uniforms.uLitness.value = litness
    },

    onResize(newWidth, newHeight) {
      projectorCamera.aspect = newWidth / newHeight
      projectorCamera.updateProjectionMatrix()
      projector.update()

      htmlToCanvas.resize(newWidth, newHeight)
      htmlToCanvas.update()
    },

    dispose() {
      htmlToCanvas.dispose()
    },
  }
}
