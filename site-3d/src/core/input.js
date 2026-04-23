/**
 * Unified input handler — normalizes mouse, touch, and pointer events
 * into a single state object the scene can consume each frame.
 *
 * What it tracks:
 *   ndc       — current pointer position in normalized device coords [-1, 1]
 *   px        — current pointer position in pixels
 *   pressed   — whether any pointer button / finger is currently down
 *   clicked   — one-frame flag: true if a tap/click ended this frame
 *               (tap = press + release with < TAP_THRESHOLD px movement)
 *   clickNdc  — NDC position of the last click/tap (for raycasting)
 *
 * Mobile notes:
 *   Single-finger touch is treated exactly like a mouse for all of the
 *   above. Two-finger gestures are intentionally ignored here — Lenis and
 *   the browser handle pinch-zoom and two-finger scroll.
 *
 *   `clicked` + `clickNdc` give Act 2 its raycasting entry point on both
 *   desktop (click) and mobile (tap) without separate code paths.
 *
 * Usage:
 *   const input = createInput()
 *   // in RAF loop:
 *   scene.animate(delta, elapsed, progress, input)
 *   input.flushFrame() // clear one-shot signals after scene.animate
 */
export function createInput() {
  const TAP_THRESHOLD_PX = 8

  const state = {
    ndc: { x: 0, y: 0 },
    px: { x: 0, y: 0 },
    pressed: false,
    clicked: false,
    clickNdc: { x: 0, y: 0 },
  }

  let pressStart = { x: 0, y: 0 }

  function toNDC(clientX, clientY) {
    return {
      x: (clientX / window.innerWidth) * 2 - 1,
      y: -(clientY / window.innerHeight) * 2 + 1,
    }
  }

  function onMove(clientX, clientY) {
    state.ndc = toNDC(clientX, clientY)
    state.px = { x: clientX, y: clientY }
  }

  function onPress(clientX, clientY) {
    state.pressed = true
    pressStart = { x: clientX, y: clientY }
  }

  function onRelease(clientX, clientY) {
    if (state.pressed) {
      const dx = clientX - pressStart.x
      const dy = clientY - pressStart.y
      if (Math.hypot(dx, dy) < TAP_THRESHOLD_PX) {
        state.clicked = true
        state.clickNdc = toNDC(clientX, clientY)
      }
    }
    state.pressed = false
  }

  // ── Mouse ────────────────────────────────────────────────────────────────
  window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY))
  window.addEventListener('mousedown', (e) => onPress(e.clientX, e.clientY))
  window.addEventListener('mouseup', (e) => onRelease(e.clientX, e.clientY))

  // ── Touch (single finger only) ───────────────────────────────────────────
  // passive: true keeps Lenis scroll performant; we don't need preventDefault
  window.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) onMove(e.touches[0].clientX, e.touches[0].clientY)
  }, { passive: true })

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) onPress(e.touches[0].clientX, e.touches[0].clientY)
  }, { passive: true })

  window.addEventListener('touchend', (e) => {
    const t = e.changedTouches[0]
    onRelease(t.clientX, t.clientY)
  }, { passive: true })

  window.addEventListener('touchcancel', () => {
    state.pressed = false
  })

  return {
    get ndc() { return state.ndc },
    get px() { return state.px },
    get pressed() { return state.pressed },
    get clicked() { return state.clicked },
    get clickNdc() { return state.clickNdc },

    /**
     * Call once per frame AFTER scene.animate() to clear one-shot signals.
     * Forgetting this means `clicked` stays true forever after the first tap.
     */
    flushFrame() {
      state.clicked = false
    },
  }
}
