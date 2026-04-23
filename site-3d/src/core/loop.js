import * as THREE from 'three'

/**
 * RAF loop — wires renderer, scene, scroll, and input together.
 *
 * Each frame:
 *   1. Advance Lenis scroll
 *   2. Call scene.animate(delta, elapsed, progress, input)
 *   3. Call scene.render(threeRenderer)
 *   4. Flush one-shot input signals
 *
 * Handles window resize by delegating to renderer, scene, and scroll.
 */
export function createLoop({ renderer, scene, scroll, input }) {
  const clock = new THREE.Clock()
  let rafId = null

  function tick(time) {
    rafId = requestAnimationFrame(tick)

    const delta = clock.getDelta()
    const elapsed = clock.elapsedTime

    scroll.raf(time)
    scene.animate(delta, elapsed, scroll.progress, input)
    scene.render(renderer.renderer)
    input.flushFrame()
  }

  function onResize() {
    renderer.onResize()
    scene.onResize(window.innerWidth, window.innerHeight)
    scroll.resize()
  }

  window.addEventListener('resize', onResize)

  return {
    start() {
      clock.start()
      rafId = requestAnimationFrame(tick)
    },

    stop() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    },
  }
}
