import * as THREE from 'three'
import RAPIER from '@dimforge/rapier3d-compat'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { placeOnFloor } from '../../../utils/scene.js'
import { ORBIT_WEIGHTS } from '../../../config.js'

/**
 * Act 2 — Snow globe
 *
 * King (center) · dark monolith slab (behind) · visible glass dome ·
 * heavy snowfall with moon gravity. Scroll drives an inertial impulse on
 * all snow. Camera orbit radius = 12m, dome radius = 8m so camera is
 * clearly outside when FOV = 100.
 */

const DOME_RADIUS    = 8
const KING_HEIGHT    = 5
const SNOW_MAX       = 150
const SPAWN_INTERVAL = 0.09
const SPAWN_BATCH    = 3
const SWING_FORCE    = 0.15

function progressToAngle(p) {
  const total    = ORBIT_WEIGHTS.reduce((s, w) => s + w, 0)
  const segAngle = (Math.PI * 2) / ORBIT_WEIGHTS.length
  let cum = 0, angle = 0
  for (let i = 0; i < ORBIT_WEIGHTS.length; i++) {
    const norm = ORBIT_WEIGHTS[i] / total
    if (p < cum + norm || i === ORBIT_WEIGHTS.length - 1)
      return angle + Math.min((p - cum) / norm, 1) * segAngle
    cum += norm; angle += segAngle
  }
  return Math.PI * 2
}

export function buildAct2({ scene }) {
  let world          = null
  let spawnTimer     = 0
  let prevProgress   = 0
  let kingColPending = false
  let kingHalfHeight = KING_HEIGHT / 2
  let kingModelRef   = null

  const snowBodies = []

  // ── Visual dome ────────────────────────────────────────────────────────
  const domeGeo = new THREE.SphereGeometry(
    DOME_RADIUS, 48, 24,
    0, Math.PI * 2,
    0, Math.PI / 2,
  )
  const domeMat = new THREE.MeshStandardMaterial({
    color:       0xcce8ff,
    transparent: true,
    opacity:     0.11,
    roughness:   0.05,
    metalness:   0.08,
    side:        THREE.DoubleSide,
    depthWrite:  false,
  })
  scene.add(new THREE.Mesh(domeGeo, domeMat))

  // ── Floor disc ─────────────────────────────────────────────────────────
  const discGeo = new THREE.CircleGeometry(DOME_RADIUS, 64)
  const discMat = new THREE.MeshStandardMaterial({ color: 0xf0ebe0, roughness: 0.9 })
  const disc    = new THREE.Mesh(discGeo, discMat)
  disc.rotation.x    = -Math.PI / 2
  disc.position.y    = 0.004
  disc.receiveShadow = true
  scene.add(disc)

  // ── Monolith slab ──────────────────────────────────────────────────────
  const monolithGeo = new THREE.BoxGeometry(1.4, 7, 0.7)
  const monolithMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.85 })
  const monolith    = new THREE.Mesh(monolithGeo, monolithMat)
  monolith.position.set(-4, 0, 0)
  placeOnFloor(monolith)
  monolith.castShadow    = true
  monolith.receiveShadow = true
  scene.add(monolith)

  // ── Snow InstancedMesh ─────────────────────────────────────────────────
  const snowGeo  = new THREE.SphereGeometry(1, 7, 5)
  const snowMat  = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 })
  const snowMesh = new THREE.InstancedMesh(snowGeo, snowMat, SNOW_MAX)
  snowMesh.castShadow = true
  snowMesh.count      = 0
  scene.add(snowMesh)

  const _iQ   = new THREE.Quaternion()
  const _pos  = new THREE.Vector3()
  const _scl  = new THREE.Vector3()
  const _mat4 = new THREE.Matrix4()
  const _yAxis = new THREE.Vector3(0, 1, 0)
  const _wallQ = new THREE.Quaternion()

  // ── King GLTF ──────────────────────────────────────────────────────────
  new GLTFLoader().load('/models/king.gltf', (gltf) => {
    const model  = gltf.scene
    const rawBox = new THREE.Box3().setFromObject(model)
    const rawH   = rawBox.max.y - rawBox.min.y
    if (rawH > 0) model.scale.setScalar(KING_HEIGHT / rawH)
    model.position.set(0, 0, 0)
    placeOnFloor(model)
    model.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true } })
    scene.add(model)

    const wb   = new THREE.Box3().setFromObject(model)
    kingHalfHeight = (wb.max.y - wb.min.y) / 2
    kingModelRef   = model

    kingColPending = true
    tryKingCollider()
  })

  function tryKingCollider() {
    if (!world || !kingColPending) return
    kingColPending = false
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed())
    const col  = RAPIER.ColliderDesc.cylinder(kingHalfHeight, 0.4)
    col.setTranslation({ x: 0, y: kingHalfHeight, z: 0 })
    col.setFriction(0.6)
    world.createCollider(col, body)
  }

  // ── Physics world ──────────────────────────────────────────────────────
  RAPIER.init().then(() => {
    world = new RAPIER.World({ x: 0, y: -1.5, z: 0 })

    // Thick floor slab — body at y=-10, half-height 10 → top face exactly at y=0
    const floorBody = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(0, -10, 0)
    )
    const floorCol = RAPIER.ColliderDesc.cuboid(100, 10, 100)
    floorCol.setFriction(0.5)
    floorCol.setRestitution(0.2)
    world.createCollider(floorCol, floorBody)

    // Monolith fixed collider — matches visual position
    const monolithBox = new THREE.Box3().setFromObject(monolith)
    const mHH = (monolithBox.max.y - monolithBox.min.y) / 2
    const monolithBody = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(
        monolith.position.x,
        monolithBox.min.y + mHH,
        monolith.position.z
      )
    )
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(0.7, mHH, 0.35).setFriction(0.6),
      monolithBody
    )

    // 14-panel polygon wall ring at DOME_RADIUS
    const N_WALLS    = 14
    const wallHalfH  = 9
    const chordHalfW = DOME_RADIUS * Math.sin(Math.PI / N_WALLS) * 1.2

    for (let i = 0; i < N_WALLS; i++) {
      const θ = (i / N_WALLS) * Math.PI * 2
      _wallQ.setFromAxisAngle(_yAxis, Math.PI / 2 - θ)

      const wBody = world.createRigidBody(
        RAPIER.RigidBodyDesc.fixed()
          .setTranslation(DOME_RADIUS * Math.cos(θ), wallHalfH - 1, DOME_RADIUS * Math.sin(θ))
          .setRotation({ x: _wallQ.x, y: _wallQ.y, z: _wallQ.z, w: _wallQ.w })
      )
      const wCol = RAPIER.ColliderDesc.cuboid(chordHalfW, wallHalfH, 0.3)
      wCol.setRestitution(0.2)
      world.createCollider(wCol, wBody)
    }

    tryKingCollider()
  })

  // ── Spawn a snow ball ──────────────────────────────────────────────────
  function spawnBall() {
    if (!world || snowBodies.length >= SNOW_MAX) return

    const radius = 0.025 + Math.random() * 0.045
    const angle  = Math.random() * Math.PI * 2
    const r      = Math.random() * DOME_RADIUS * 0.60
    const y      = 6 + Math.random() * 4

    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(Math.cos(angle) * r, y, Math.sin(angle) * r)
        .setLinearDamping(0.4)
        .setAngularDamping(0.5)
        .setCcdEnabled(true)
    )

    const col = RAPIER.ColliderDesc.ball(radius)
    col.setDensity(1.0)
    col.setRestitution(0.5)
    col.setFriction(0.3)
    world.createCollider(col, body)

    snowBodies.push({ body, radius })
    snowMesh.count = snowBodies.length
  }

  // ── Frame loop ─────────────────────────────────────────────────────────
  return {
    animate({ delta, progress }) {
      if (!world) return

      world.step()

      const dP     = progress - prevProgress
      prevProgress = progress
      const dPSafe = Math.abs(dP) > 0.3 ? 0 : dP

      if (Math.abs(dPSafe) > 0.0001) {
        const θ  = progressToAngle(progress)
        const ix = -Math.cos(θ) * dPSafe * SWING_FORCE
        const iz =  Math.sin(θ) * dPSafe * SWING_FORCE

        for (const { body } of snowBodies) {
          body.applyImpulse({ x: ix, y: 0, z: iz }, true)
        }
      }

      if (snowBodies.length < SNOW_MAX) {
        spawnTimer += delta
        if (spawnTimer >= SPAWN_INTERVAL) {
          spawnTimer = 0
          for (let i = 0; i < SPAWN_BATCH; i++) spawnBall()
        }
      }

      for (let i = 0; i < snowBodies.length; i++) {
        const { body, radius } = snowBodies[i]
        const t = body.translation()
        _pos.set(t.x, t.y, t.z)
        _scl.setScalar(radius)
        _mat4.compose(_pos, _iQ, _scl)
        snowMesh.setMatrixAt(i, _mat4)
      }

      if (snowBodies.length > 0) snowMesh.instanceMatrix.needsUpdate = true
    },

    dispose() {
      scene.remove(snowMesh)
      snowGeo.dispose();  snowMat.dispose()
      domeGeo.dispose();  domeMat.dispose()
      discGeo.dispose();  discMat.dispose()
      monolithGeo.dispose(); monolithMat.dispose()
    },
  }
}
