/**
 * Dev-only debug tooling. Tree-shaken out of production builds.
 *
 * Provides:
 *   - FPS / memory stats panel (stats.js) — top-left corner
 *   - lil-gui controls panel — top-right corner, grouped per act
 *
 * Note: Leva was considered but requires React, which this project doesn't
 * use. lil-gui is the vanilla JS equivalent — same API surface, zero deps.
 *
 * Usage in main.js:
 *   if (import.meta.env.DEV) {
 *     const { createDebug } = await import('./dev/debug.js')
 *     createDebug({ scene, renderer, scroll })
 *   }
 *
 * Each stage can add its own folder to the GUI via `addActFolder(gui)` —
 * see per-act TODO comments below.
 */

import Stats from 'stats.js'
import GUI from 'lil-gui'

/**
 * @param {{ scene: import('../scenes/Scene.js').Scene, renderer: object, scroll: object }} opts
 */
export function createDebug({ scene, renderer, scroll }) {
  // ── Stats panel (FPS / MS / MB) ──────────────────────────────────────────
  const stats = new Stats()
  stats.showPanel(0) // 0: fps, 1: ms, 2: mb
  stats.dom.style.cssText = 'position:fixed;top:0;left:0;z-index:9999;'
  document.body.appendChild(stats.dom)

  // Hook stats into the RAF loop by monkey-patching Scene.animate
  const origAnimate = scene.animate.bind(scene)
  scene.animate = (...args) => {
    stats.begin()
    origAnimate(...args)
    stats.end()
  }

  // ── lil-gui controls ─────────────────────────────────────────────────────
  const gui = new GUI({ title: 'Debug', width: 300 })
  gui.domElement.style.zIndex = '9999'

  // ── Scene folder ─────────────────────────────────────────────────────────
  const sceneFolder = gui.addFolder('Scene')

  // Background / fog color — update both so they stay in sync
  const sceneState = {
    background: '#faf8f5',
    fogDensity: 0.022,
  }
  sceneFolder
    .addColor(sceneState, 'background')
    .name('Background')
    .onChange((v) => {
      scene.threeScene.background.set(v)
      if (scene.threeScene.fog) scene.threeScene.fog.color.set(v)
    })
  sceneFolder
    .add(sceneState, 'fogDensity', 0, 0.1, 0.001)
    .name('Fog density')
    .onChange((v) => {
      if (scene.threeScene.fog) scene.threeScene.fog.density = v
    })

  // ── Camera folder ────────────────────────────────────────────────────────
  const camFolder = gui.addFolder('Camera')
  const camState = {
    fov: scene.camera.fov,
    'log progress': false,
  }
  camFolder
    .add(camState, 'fov', 20, 90, 1)
    .name('FOV')
    .onChange((v) => {
      scene.camera.fov = v
      scene.camera.updateProjectionMatrix()
    })
  // Log scroll progress to console each frame for keyframe tuning
  camFolder.add(camState, 'log progress').name('Log progress').onChange((v) => {
    if (v) {
      const origRender = scene.render.bind(scene)
      scene.render = (...args) => {
        origRender(...args)
        console.log('progress', scroll.progress.toFixed(4))
      }
    } else {
      scene.render = scene.render.bind(scene) // restore (simplified)
    }
  })

  // ── Lighting folder ──────────────────────────────────────────────────────
  const lightFolder = gui.addFolder('Lighting')
  // Traverse scene to find the directional lights added in Scene.#setupLights()
  scene.threeScene.traverse((obj) => {
    if (obj.isDirectionalLight) {
      const f = lightFolder.addFolder(obj.name || `Light (${obj.uuid.slice(0, 6)})`)
      f.add(obj, 'intensity', 0, 5, 0.1).name('Intensity')
      f.addColor({ color: '#' + obj.color.getHexString() }, 'color')
        .name('Color')
        .onChange((v) => obj.color.set(v))
    }
    if (obj.isAmbientLight) {
      const f = lightFolder.addFolder('Ambient')
      f.add(obj, 'intensity', 0, 3, 0.05).name('Intensity')
    }
  })

  // ── Act 1 folder (populated by act1.js once geometry exists) ────────────
  // Stage 1: call gui.addFolder('Act 1') inside buildAct1 and expose:
  //   - Panel depth (BoxGeometry z dimension)
  //   - Panel color
  //   - uLitness override (manual blend between flat and lit)

  // ── Renderer folder ──────────────────────────────────────────────────────
  const rendererFolder = gui.addFolder('Renderer')
  rendererFolder
    .add({ exposure: 1.0 }, 'exposure', 0.1, 3, 0.05)
    .name('Exposure')
    .onChange((v) => { renderer.renderer.toneMappingExposure = v })

  // Collapse non-critical folders by default
  lightFolder.close()
  rendererFolder.close()

  return { stats, gui }
}
