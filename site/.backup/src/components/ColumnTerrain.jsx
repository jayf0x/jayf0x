import { Suspense, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { WebGPURenderer } from 'three/webgpu'
import * as THREE from 'three'
import { ColumnGrid } from './ColumnGrid'
import { TERRAIN } from '../config/terrain'

// Compute camera position from spherical coordinates — the explicit, readable way.
const cameraPosition = new THREE.Vector3().setFromSphericalCoords(
  TERRAIN.cameraDistance,
  TERRAIN.cameraSphericalPhi,
  TERRAIN.cameraSphericalTheta,
)

// Keeps ortho zoom in sync so worldViewWidth world units always fill the canvas.
function OrthoZoom() {
  const { camera, size } = useThree()
  useEffect(() => {
    if (camera instanceof THREE.OrthographicCamera) {
      camera.zoom = size.width / TERRAIN.worldViewWidth
      camera.updateProjectionMatrix()
    }
  }, [camera, size.width, size.height])
  return null
}

export function ColumnTerrain() {
  const [tx, ty, tz] = TERRAIN.cameraTarget

  return (
    <Canvas
      orthographic
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      gl={async (props) => {
        const renderer = new WebGPURenderer({ canvas: props.canvas, antialias: true })
        await renderer.init()
        return renderer
      }}
      camera={{
        position: [cameraPosition.x, cameraPosition.y, cameraPosition.z],
        up: [0, 1, 0],
        near: 0.1,
        far: 300,
      }}
      onCreated={({ camera }) => {
        camera.lookAt(tx, ty, tz)
      }}
    >
      <OrthoZoom />

      {/* Background color — swap to '#f5f5f0' for light palette */}
      <color attach="background" args={[TERRAIN.bgColor]} />
      {/* Lighting handled in TSL (ColumnGrid) to avoid WebGPU LightsNode issues */}

      <Suspense fallback={null}>
        <ColumnGrid />
      </Suspense>
    </Canvas>
  )
}
