import * as THREE from 'three'
import { smoothstep, clamp } from '../utils/math.js'
import { buildAct1 } from './acts/act1/index.js'
import { buildAct2 } from './acts/act2/index.js'
import { buildAct3 } from './acts/act3/index.js'
import {
  ACT1_DEAD_ZONE,
  ORBIT_RADIUS,
  ORBIT_WEIGHTS,
  ACT3_ANGLE_THRESHOLD,
  ACT3_HYSTERESIS,
  CAMERA_EYE_HEIGHT,
} from '../config.js'

/**
 * Scene — the 3D world orchestrator.
 *
 * Camera orbit: a perfect circle of radius ORBIT_RADIUS around the origin.
 *   0°  (progress ≈ 0.00) — front,  Act 1 red cube
 *   90° (progress ≈ 0.25) — right,  Act 2 workspace + bridge
 *   180°(progress ≈ 0.50) — behind, Act 3 terminal (locks in)
 *   270°(progress ≈ 0.75) — left,   Act 2 return side
 *
 * Pacing: ORBIT_WEIGHTS maps each 90° quadrant to a share of total scroll.
 * Higher weight = more drag = camera feels slower through that quadrant.
 *
 * Act 3 lock-in: camera freezes at 180° once within ACT3_ANGLE_THRESHOLD.
 * Escaping requires scrolling ACT3_HYSTERESIS × threshold beyond the boundary.
 */

const CAMERA_FOV = 100

// ── Orbit math ───────────────────────────────────────────────────────────────

/**
 * Maps scroll progress [0,1) → orbit angle [0, 2π) with per-quadrant drag.
 *
 * Each entry in `weights` controls one 90° slice of the orbit.
 * The slice consumes `weight / totalWeight` of the total scroll range,
 * so a heavy quadrant takes more scrolling to traverse.
 *
 * @param {number}   p       - orbitProgress after dead-zone, in [0,1)
 * @param {number[]} weights - one weight per 90° quadrant
 * @returns {number} angle in radians
 */
function weightedProgressToAngle(p, weights) {
  const total = weights.reduce((s, w) => s + w, 0)
  const segAngle = (Math.PI * 2) / weights.length
  let cumProgress = 0
  let angle = 0
  for (let i = 0; i < weights.length; i++) {
    const norm = weights[i] / total
    if (p < cumProgress + norm || i === weights.length - 1) {
      const t = Math.min((p - cumProgress) / norm, 1)
      return angle + t * segAngle
    }
    cumProgress += norm
    angle += segAngle
  }
  return Math.PI * 2
}

// ── Scene class ──────────────────────────────────────────────────────────────

export class Scene {
  constructor(renderer) {
    this.width = window.innerWidth
    this.height = window.innerHeight

    this.threeScene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(
      CAMERA_FOV,
      this.width / this.height,
      0.5,
      150
    )

    // Start at 0° (front of orbit), eye at person height
    this.camera.position.set(0, CAMERA_EYE_HEIGHT, ORBIT_RADIUS)
    this.camera.lookAt(0, 0, 0)

    // Act 3 lock-in state
    this._act3Locked = false
    this._act3Target = new THREE.Vector3(0, CAMERA_EYE_HEIGHT, -ORBIT_RADIUS) // 180° position

    this.#setupScene()
    this.#setupLights()
    this.#buildActs(renderer)
  }

  // ── Scene + lights ──────────────────────────────────────────────────────

  #setupScene() {
    this.threeScene.background = new THREE.Color(0xfaf8f5)
    this.threeScene.fog = new THREE.FogExp2(0xfaf8f5, 0.022)
  }

  #setupLights() {
    this.threeScene.add(new THREE.AmbientLight(0xfff5ec, 0.9))

    const key = new THREE.DirectionalLight(0xffffff, 2.2)
    key.position.set(6, 10, 8)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.near = 1
    key.shadow.camera.far = 50
    key.shadow.camera.left = -18
    key.shadow.camera.right = 18
    key.shadow.camera.top = 14
    key.shadow.camera.bottom = -14
    key.shadow.bias = -0.0002
    key.shadow.normalBias = 0.02
    this.threeScene.add(key)

    const fill = new THREE.DirectionalLight(0xd0e4ff, 0.5)
    fill.position.set(-8, 3, 4)
    this.threeScene.add(fill)
  }

  // ── Acts ────────────────────────────────────────────────────────────────

  #buildActs(renderer) {
    this.act1 = buildAct1({
      scene: this.threeScene,
      camera: this.camera,
      width: this.width,
      height: this.height,
    })

    this.act2 = buildAct2({
      scene: this.threeScene,
      camera: this.camera,
    })

    this.act3 = buildAct3({
      scene: this.threeScene,
      camera: this.camera,
    })
  }

  // ── Frame loop ──────────────────────────────────────────────────────────

  animate(delta, elapsed, progress, input) {
    // Dead zone — first ACT1_DEAD_ZONE of scroll doesn't move camera
    const orbitProgress = progress < ACT1_DEAD_ZONE
      ? 0
      : (progress - ACT1_DEAD_ZONE) / (1 - ACT1_DEAD_ZONE)

    const angle = weightedProgressToAngle(orbitProgress, ORBIT_WEIGHTS)

    // Act 3 angle-based lock with hysteresis.
    // Locks on entry within ACT3_ANGLE_THRESHOLD of 180°.
    // Requires ACT3_HYSTERESIS × extra angle to escape.
    const angleDist = Math.abs(angle - Math.PI)
    if (!this._act3Locked) {
      if (angleDist < ACT3_ANGLE_THRESHOLD) this._act3Locked = true
    } else {
      if (angleDist > ACT3_ANGLE_THRESHOLD * (1 + ACT3_HYSTERESIS)) this._act3Locked = false
    }
    const inAct3 = this._act3Locked

    if (inAct3) {
      // Lerp to exact 180° — feels like a magnetic snap
      this.camera.position.lerp(this._act3Target, 0.08)
      this.camera.lookAt(0, 0, 0)
    } else {
      // Perfect circular orbit at eye height
      this.camera.position.set(
        ORBIT_RADIUS * Math.sin(angle),
        CAMERA_EYE_HEIGHT,
        ORBIT_RADIUS * Math.cos(angle)
      )
      this.camera.lookAt(0, 0, 0)
    }

    // litness: 0 at rest (flat HTML illusion), 1 at full orbit (PBR)
    const distFromRest = clamp(Math.min(progress, 1 - progress) * 2, 0, 1)
    const litness = inAct3 ? 1 : smoothstep(distFromRest)

    this.act1?.animate({ delta, elapsed, progress, litness, input })
    this.act2?.animate({ delta, elapsed, progress, input })
    this.act3?.animate({ delta, elapsed, progress, input, inAct3 })
  }

  render(threeRenderer) {
    threeRenderer.render(this.threeScene, this.camera)
  }

  // ── Resize ──────────────────────────────────────────────────────────────

  onResize(width, height) {
    this.width = width
    this.height = height

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    this.act1?.onResize(width, height)
  }
}
