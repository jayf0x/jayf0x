import * as THREE from 'three'
import HtmlToCanvas from '../../../utils/html-to-canvas.js'
import { createProjector } from '../../../utils/projected-material.js'
import { collectDocumentCss } from '../../../utils/collect-css.js'
import { placeOnFloor } from '../../../utils/scene.js'

/**
 * Act 1 — The Front Face (flat illusion)
 *
 * From 0° reads as a flat website. HTML projected from a frozen camera onto
 * a single large slab. At FOV=100, camera at z=12 sees ~28m wide × 16m tall.
 *
 * uLitness = 0 → flat projected texture
 * uLitness = 1 → full PBR
 */
export function buildAct1({ scene, camera, width, height }) {
  const projectorCamera = camera.clone()
  projectorCamera.updateMatrixWorld()

  const pageEl = document.getElementById('page')
  const htmlToCanvas = new HtmlToCanvas(pageEl, {
    width,
    height,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
  })

  const projector = createProjector({
    camera: projectorCamera,
    texture: htmlToCanvas.texture,
  })

  ;(async () => {
    if (document.fonts?.ready) await document.fonts.ready
    htmlToCanvas.extraCss = await collectDocumentCss()
    await htmlToCanvas.update()
  })()

  // Single slab sized to fill viewport at FOV=100, orbit radius 12.
  // Half-width = tan(50°) * 12 ≈ 14.3m → full width ~28.6m, height ~16m (16:9).
  const slabGeo = new THREE.BoxGeometry(30, 17, 0.4)
  const slabMat = new THREE.MeshStandardMaterial({ color: 0xfaf8f5, roughness: 0.75 })
  const slab = new THREE.Mesh(slabGeo, slabMat)
  slab.position.set(0, 0, 0)
  placeOnFloor(slab)
  slab.castShadow = true
  slab.receiveShadow = true
  scene.add(slab)
  projector.applyTo(slab)

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
      slabGeo.dispose()
      slabMat.dispose()
    },
  }
}
