/**
 * Math utilities for animation and interpolation.
 */

/** Hermite smoothstep — S-curve easing for t in [0, 1] */
export function smoothstep(t) {
  return t * t * (3 - 2 * t)
}

/** Linear interpolation from a to b */
export function lerp(a, b, t) {
  return a + (b - a) * t
}

/** Clamp value between min and max */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

/**
 * Interpolates a camera offset through a sorted keyframe array.
 *
 * Each keyframe: { x, y, z, roll }
 * Keyframes are evenly distributed across [0, 1) — no `t` property needed.
 * First and last keyframe should match for a seamless loop.
 *
 * @param {number} progress - scroll progress in [0, 1)
 * @param {Array<{x: number, y: number, z: number, roll: number}>} keyframes
 * @returns {{ x: number, y: number, z: number, roll: number }}
 */
export function keyframeValue(progress, keyframes) {
  const segments = keyframes.length - 1
  const scaled = progress * segments
  const idx = Math.min(Math.floor(scaled), segments - 1)
  const t = smoothstep(scaled - idx)
  const a = keyframes[idx]
  const b = keyframes[idx + 1]
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
    roll: lerp(a.roll, b.roll, t),
  }
}
