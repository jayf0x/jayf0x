import { useEffect, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
// @ts-ignore — plain JS module
import HtmlToCanvas from "../html2canvas/html-to-canvas.js"
// @ts-ignore
import { createProjector } from "../html2canvas/projected-material.js"
// @ts-ignore
import { collectDocumentCss } from "../html2canvas/collect-css.js"

// Viewing direction from the default camera position [0, 3, 8] toward origin [0, 0, 0].
// Frozen at module load — used every frame to compute uLitness from orbit angle.
const REST_DIR = new THREE.Vector3(0, -3, -8).normalize()

export function ProjectedSlab() {
  const { camera } = useThree()
  const meshRef = useRef<THREE.Mesh>(null)
  const projectorRef = useRef<ReturnType<typeof createProjector> | null>(null)
  const h2cRef = useRef<InstanceType<typeof HtmlToCanvas> | null>(null)
  const currentDir = useRef(new THREE.Vector3())

  useEffect(() => {
    const el = document.getElementById("page")
    if (!el || !meshRef.current) return

    // Snapshot the camera at its rest position. This camera never moves —
    // it acts as the "slide projector" so the texture looks flat from the front.
    camera.updateMatrixWorld()
    const projectorCamera = camera.clone() as THREE.PerspectiveCamera

    const h2c = new HtmlToCanvas(el, {
      width: el.offsetWidth || 600,
      height: el.offsetHeight || 900,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
    })
    h2cRef.current = h2c

    const projector = createProjector({ camera: projectorCamera, texture: h2c.texture })
    projectorRef.current = projector

    projector.applyTo(meshRef.current)

    ;(async () => {
      if (document.fonts?.ready) await document.fonts.ready
      h2c.extraCss = await collectDocumentCss()
      await h2c.update()
    })()

    return () => {
      h2cRef.current?.dispose()
      projectorRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps — intentional snapshot at mount

  useFrame(({ camera: sceneCamera }) => {
    const projector = projectorRef.current
    if (!projector) return

    // Sync projector matrices every frame so the shader stays in sync with the
    // frozen projector camera's world position (doesn't change but Three.js
    // requires the call to populate uniforms correctly).
    projector.update()

    // Drive uLitness: 0 = flat HTML illusion (camera at rest), 1 = full PBR (45° rotated).
    sceneCamera.getWorldDirection(currentDir.current)
    const dot = Math.max(-1, Math.min(1, REST_DIR.dot(currentDir.current)))
    const angle = Math.acos(dot)
    projector.uniforms.uLitness.value = THREE.MathUtils.clamp(angle / (Math.PI / 4), 0, 1)
  })

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      {/* Sized to fill the camera's view frustum at FOV=50, distance ~8.5 units */}
      <boxGeometry args={[6, 8, 0.4]} />
      <meshStandardMaterial color="#faf8f5" roughness={0.75} />
    </mesh>
  )
}
