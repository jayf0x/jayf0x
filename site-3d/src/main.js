import './style.css'
import { createRenderer } from './core/renderer.js'
import { createScroll } from './core/scroll.js'
import { createInput } from './core/input.js'
import { createLoop } from './core/loop.js'
import { Scene } from './scenes/Scene.js'

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('app')

  const renderer = createRenderer(container)
  const scroll = createScroll()
  const input = createInput()
  const scene = new Scene(renderer)
  const loop = createLoop({ renderer, scene, scroll, input })

  loop.start()

  // Dev tooling — tree-shaken in production
  if (import.meta.env.DEV) {
    const { createDebug } = await import('./dev/debug.js')
    createDebug({ scene, renderer, scroll })
  }
})
