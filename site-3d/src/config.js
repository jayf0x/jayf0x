/**
 * Shared constants — import from here, never hardcode in act files.
 *
 * Scroll zone boundaries: progress [0, 1) mapped to camera orbit.
 * Think of the orbit as a clock face:
 *   0.00 = 12 o'clock  (Act 1, front face)
 *   0.25 = 3 o'clock   (Act 2, right side)
 *   0.50 = 6 o'clock   (Act 3, behind / 180°)
 *   0.75 = 9 o'clock   (Act 2, left side)
 *   1.00 = 12 o'clock  (Act 1 again, looped)
 *
 * Tweak ZONE thresholds in Stage 1 once camera keyframes are finalised.
 * Every act that depends on these imports from here — do NOT hardcode.
 */

// ── Scroll dead zone (Act 1 "locked" feel) ────────────────────────────────
// Progress must exceed this before the camera starts visibly moving.
// Achieved by a no-op at the start of Scene.animate() — not by Lenis.
// Tune this in Stage 1 until Act 1 "feels" locked while the HTML is front-on.
export const ACT1_DEAD_ZONE = 0.04

// ── Act zone boundaries ───────────────────────────────────────────────────

/** Act 1 is "active" (flat illusion) when progress is near 0 or 1 */
export const ACT1_ZONE = { enter: 0.0, exit: 0.12 }

/** Act 2 occupies the wide middle band */
export const ACT2_ZONE = { enter: 0.12, exit: 0.88 }

/**
 * Act 3 snap zone — camera lerps to ACT3_CAMERA_POS when progress is here.
 * Centred on 0.50 (= 180°, the "behind" keyframe in Scene.js).
 * Narrow band: user must scroll clearly past Act 2 to trigger it.
 */
export const ACT3_ZONE = { enter: 0.42, exit: 0.58 }  // kept for reference

// ── Act 3 camera snap ─────────────────────────────────────────────────────
// Camera lands at 180° on the orbit circle (0, 0, -ORBIT_RADIUS).
// Override in Stage 3 once desk geometry is placed.
export const ACT3_CAMERA_POS = { x: 0, y: 0, z: -12 }
export const ACT3_LOOK_POS   = { x: 0, y: 0, z: 0 }

// ── Circular orbit ────────────────────────────────────────────────────────

/** Radius of the camera orbit circle. Acts are laid out at 0°/90°/180°. */
export const ORBIT_RADIUS = 12

/** Camera eye height in scene units (1 unit = 1 m). 1.8 = 180 cm person. */
export const CAMERA_EYE_HEIGHT = 1.8

/**
 * Scroll-drag weight per 90° orbit quadrant.
 * [ front→right, right→back, back→left, left→front ]
 *   i.e. [ Act1 zone,  Act2→3,  behind,  return ]
 *
 * Higher weight = more scroll consumed → camera feels slower / heavier.
 * Constraint: weights[0] + weights[1] must equal 0.50 so that 180°
 * falls exactly at scroll midpoint (progress = 0.50).
 *
 * Edit these values to tune pacing. Sum need not equal 1 — normalised internally.
 */
export const ORBIT_WEIGHTS = [0.35, 0.15, 0.30, 0.20]

// ── Act 3 lock-in ─────────────────────────────────────────────────────────

/** Camera locks when within this many radians of the 180° orbit position (~20°). */
export const ACT3_ANGLE_THRESHOLD = 0.35

/**
 * Fraction of ACT3_ANGLE_THRESHOLD that must be exceeded to ESCAPE the lock.
 * 0.8 → need to scroll 80% further than the entry angle before unlocking.
 */
export const ACT3_HYSTERESIS = 0.8
