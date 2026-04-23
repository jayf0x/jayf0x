import * as THREE from 'three'

/**
 * Creates the WebGL renderer and appends its canvas to `container`.
 *
 * Returns a thin wrapper so the rest of the app never touches
 * THREE.WebGLRenderer directly — keeps resize and dispose in one place.
 *
 * Mobile notes:
 *   DPR is capped at 2 to stay performant on high-density screens.
 *   `touch-action: none` on the canvas prevents the browser from
 *   intercepting pointer events we want Three.js / Lenis to handle.
 */
export function createRenderer(container) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  })

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.VSMShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0

  // Canvas sits above all DOM content
  const el = renderer.domElement
  el.style.position = 'fixed'
  el.style.inset = '0'
  el.style.zIndex = '35'
  el.style.touchAction = 'none' // let our input handler own pointer events

  container.appendChild(el)

  return {
    /** The underlying THREE.WebGLRenderer — use sparingly */
    renderer,

    onResize() {
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    },

    dispose() {
      renderer.dispose()
      el.remove()
    },
  }
}
