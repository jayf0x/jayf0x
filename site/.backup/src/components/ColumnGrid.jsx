import { useRef, useMemo, useEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { MeshBasicNodeMaterial } from "three/webgpu"
import {
  uniform,
  attribute,
  vec3,
  mx_noise_float,
  mix,
  positionLocal,
  float,
  normalLocal,
} from "three/tsl"
import { TERRAIN } from "../config/terrain"

// Parse hex color to vec3 [r, g, b] in linear space (approximate)
function hexToVec3(hex) {
  const c = new THREE.Color(hex)
  return [c.r, c.g, c.b]
}

export function ColumnGrid() {
  const { viewport } = useThree()
  const meshRef = useRef(null)
  const timeRef = useRef(0)

  const { cols, rows, gapFraction, minHeight, maxHeight, animSpeed, spatialFreq } = TERRAIN

  // With OrthoZoom, viewport.width === worldViewWidth regardless of screen size.
  const vw = viewport.width
  const cellSize = vw / cols
  const colSize = cellSize * (1 - gapFraction)
  const instanceCount = cols * rows

  // Panel half-width in camera-right space = 30% of frustum width.
  // This correctly maps to the HTML panel's 60% CSS width in ortho projection.
  const panelHalfWidth = vw * 0.3

  // ----- TSL uniforms -----
  const timeU = useMemo(() => uniform(0.0), [])
  const minHU = useMemo(() => uniform(minHeight), [minHeight])
  const maxHU = useMemo(() => uniform(maxHeight), [maxHeight])
  const edge0U = useMemo(
    () => uniform(panelHalfWidth - TERRAIN.panelFadeWidth * 0.5),
    [panelHalfWidth]
  )
  const edge1U = useMemo(
    () => uniform(panelHalfWidth + TERRAIN.panelFadeWidth * 0.5),
    [panelHalfWidth]
  )

  // Camera right vector uniform — updated every frame from camera.matrixWorld.
  // Used to project column world positions onto screen-X for panel fade alignment.
  // With a dimetric camera, world-X ≠ screen-X; camera-right projection fixes this.
  const cameraRightU = useMemo(() => uniform(new THREE.Vector3(1, 0, 0)), [])

  // Normalized light directions for manual TSL lighting
  const keyDir = useMemo(() => {
    const v = new THREE.Vector3(...TERRAIN.dirLight1Position).normalize()
    return uniform(v)
  }, [])
  const fillDir = useMemo(() => {
    const v = new THREE.Vector3(...TERRAIN.dirLight2Position).normalize()
    return uniform(v)
  }, [])

  const material = useMemo(() => {
    const mat = new MeshBasicNodeMaterial({ transparent: true })

    // ----- Manual diffuse lighting (bypasses Three.js LightsNode) -----
    const [cr, cg, cb] = hexToVec3(TERRAIN.columnColor)
    const baseColor = vec3(cr, cg, cb)

    const keyNdotL = normalLocal.dot(keyDir).max(0)
    const fillNdotL = normalLocal.dot(fillDir).max(0)
    const lighting = keyNdotL
      .mul(TERRAIN.dirLight1Intensity)
      .add(fillNdotL.mul(TERRAIN.dirLight2Intensity))
      .add(TERRAIN.ambientIntensity)

    // ----- Column height via GPU noise -----
    const nX = attribute("nposX", "float")
    const nZ = attribute("nposZ", "float")
    const n = mx_noise_float(vec3(nX, nZ, timeU))
      .mul(0.5)
      .add(0.5)
    const height = mix(minHU, maxHU, n)
    mat.positionNode = vec3(
      positionLocal.x,
      positionLocal.y.add(float(0.5)).mul(height),
      positionLocal.z
    )

    // ----- Panel fade via camera-right projection -----
    // worldX = nposX / spatialFreq, worldZ = nposZ / spatialFreq
    // screenX (camera-right space) = dot(worldPos, cameraRight)
    // This aligns the fade with the HTML panel regardless of camera tilt.
    const worldX = nX.div(float(spatialFreq))
    const worldZ = nZ.div(float(spatialFreq))
    const cr2 = cameraRightU
    const screenX = cr2.x.mul(worldX).add(cr2.z.mul(worldZ)).abs()
    mat.opacityNode = screenX.smoothstep(edge0U, edge1U)

    mat.colorNode = baseColor.mul(lighting)

    return mat
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeU, minHU, maxHU, edge0U, edge1U, cameraRightU, keyDir, fillDir])

  const { geometry, matrices } = useMemo(() => {
    const geo = new THREE.BoxGeometry(colSize, 1, colSize)
    const nx = new Float32Array(instanceCount)
    const nz = new Float32Array(instanceCount)
    const mats = []
    const dummy = new THREE.Object3D()
    let i = 0

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const wx = -vw / 2 + cellSize * (c + 0.5)
        const wz = -cellSize * r
        dummy.position.set(wx, 0, wz)
        dummy.updateMatrix()
        mats.push(dummy.matrix.clone())
        nx[i] = wx * spatialFreq
        nz[i] = wz * spatialFreq
        i++
      }
    }

    geo.setAttribute("nposX", new THREE.InstancedBufferAttribute(nx, 1))
    geo.setAttribute("nposZ", new THREE.InstancedBufferAttribute(nz, 1))

    return { geometry: geo, matrices: mats }
  }, [colSize, instanceCount, cols, rows, vw, cellSize, spatialFreq])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m))
    mesh.instanceMatrix.needsUpdate = true
  }, [matrices])

  useFrame(({ camera }, delta) => {
    timeRef.current += delta * animSpeed
    timeU.value = timeRef.current
    // Keep camera-right uniform in sync (static camera: runs once, stays stable)
    cameraRightU.value.setFromMatrixColumn(camera.matrixWorld, 0)
  })

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, instanceCount]} frustumCulled={false} />
  )
}
