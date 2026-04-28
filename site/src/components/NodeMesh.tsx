import { useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import type { Mesh, MeshStandardMaterial } from "three"
import { Color } from "three"
import { useHighlightStore } from "../store/highlightStore"
import { SLABS } from "../layout/slabs"
import type { RegistryNode } from "../store/registryStore"

const IDLE_INTENSITY = 0.18
const ACTIVE_INTENSITY = 1.2
const LERP_SPEED = 4

interface Props {
  node: RegistryNode
}

export function NodeMesh({ node }: Props) {
  const meshRef = useRef<Mesh>(null)
  const emissiveRef = useRef(IDLE_INTENSITY)
  const targetRef = useRef(IDLE_INTENSITY)

  const nodeState = useHighlightStore((s) => s.states[node.id] ?? "IDLE")
  const color = SLABS[node.slab].color

  useEffect(() => {
    if (nodeState === "ACTIVE") {
      emissiveRef.current = ACTIVE_INTENSITY
      targetRef.current = ACTIVE_INTENSITY
    } else {
      targetRef.current = IDLE_INTENSITY
    }
  }, [nodeState])

  useFrame((_, delta) => {
    const mat = meshRef.current?.material as MeshStandardMaterial | undefined
    if (!mat) return
    const lerped = emissiveRef.current + (targetRef.current - emissiveRef.current) * (1 - Math.exp(-LERP_SPEED * delta))
    emissiveRef.current = lerped
    mat.emissiveIntensity = lerped
  })

  return (
    <group position={node.position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={new Color(color)}
          emissiveIntensity={IDLE_INTENSITY}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      <Text
        position={[0, -0.22, 0]}
        fontSize={0.11}
        color={color}
        anchorX="center"
        anchorY="top"
        fillOpacity={0.55}
        renderOrder={1}
      >
        {node.label}
      </Text>
    </group>
  )
}
