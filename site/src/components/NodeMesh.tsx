import { useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import type { Mesh, MeshStandardMaterial } from "three"
import { Color } from "three"
import { useHighlightStore } from "../store/highlightStore"
import { SLABS } from "../layout/slabs"
import { CONNECTABLE_ROLES, type RegistryNode } from "../store/registryStore"

// Visual config per role class
const ROLE_CONFIG = {
  connectable: { radius: 0.12, idleIntensity: 0.20 as number, labelOpacity: 0.60 },
  structural:  { radius: 0.075, idleIntensity: 0.10 as number, labelOpacity: 0.30 },
}

const ACTIVE_INTENSITY = 1.2
const LERP_SPEED = 4

interface Props {
  node: RegistryNode
}

export function NodeMesh({ node }: Props) {
  const meshRef = useRef<Mesh>(null)
  const cfg = CONNECTABLE_ROLES.has(node.role) ? ROLE_CONFIG.connectable : ROLE_CONFIG.structural
  const emissiveRef = useRef(cfg.idleIntensity)
  const targetRef   = useRef(cfg.idleIntensity)

  const nodeState = useHighlightStore((s) => s.states[node.id] ?? "IDLE")
  const color = SLABS[node.slab].color

  useEffect(() => {
    if (nodeState === "ACTIVE") {
      emissiveRef.current = ACTIVE_INTENSITY
      targetRef.current   = ACTIVE_INTENSITY
    } else {
      targetRef.current = cfg.idleIntensity
    }
  }, [nodeState, cfg.idleIntensity])

  useFrame((_, delta) => {
    const mat = meshRef.current?.material as MeshStandardMaterial | undefined
    if (!mat) return
    const lerped =
      emissiveRef.current +
      (targetRef.current - emissiveRef.current) * (1 - Math.exp(-LERP_SPEED * delta))
    emissiveRef.current = lerped
    mat.emissiveIntensity = lerped
  })

  return (
    <group position={node.position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[cfg.radius, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={new Color(color)}
          emissiveIntensity={cfg.idleIntensity}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      <Text
        position={[0, -(cfg.radius + 0.10), 0]}
        fontSize={CONNECTABLE_ROLES.has(node.role) ? 0.11 : 0.085}
        color={color}
        anchorX="center"
        anchorY="top"
        fillOpacity={cfg.labelOpacity}
        renderOrder={1}
      >
        {node.label}
      </Text>
    </group>
  )
}
