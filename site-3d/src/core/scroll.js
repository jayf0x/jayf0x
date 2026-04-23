import Lenis from 'lenis'

/**
 * Wraps Lenis infinite smooth scroll.
 *
 * Exposes a single `progress` value [0, 1) that loops continuously as
 * the user scrolls. This value drives the camera orbit in Scene.js.
 *
 * Mobile: `syncTouch: true` maps single-finger swipe → scroll progress,
 * so the orbit works identically on touch devices without extra code.
 */
export function createScroll() {
  const lenis = new Lenis({
    infinite: true,    // scroll loops forever — progress wraps 0→1→0
    smoothWheel: true,
    syncTouch: true,   // enable touch-driven scroll on mobile / tablet
    lerp: 0.08,        // smoothing factor (lower = more lag)
  })

  return {
    /** Must be called every frame with the rAF timestamp */
    raf(time) {
      lenis.raf(time)
    },

    /** Normalized scroll progress: [0, 1) — maps one full scroll to one orbit */
    get progress() {
      const limit = lenis.limit
      if (!limit) return 0
      const raw = (lenis.scroll % limit) / limit
      return raw < 0 ? raw + 1 : raw
    },

    resize() {
      lenis.resize()
    },

    destroy() {
      lenis.destroy()
    },
  }
}
