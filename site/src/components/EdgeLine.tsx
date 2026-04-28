import { Line } from "@react-three/drei"
import type { RegistryNode } from "../store/registryStore"
import { SLABS } from "../layout/slabs"

interface Props {
  source: RegistryNode
  target: RegistryNode
}

export function EdgeLine({ source, target }: Props) {
  const color = SLABS[source.slab].color
  return (
    <Line
      points={[source.position, target.position]}
      color={color}
      lineWidth={0.8}
      transparent
      opacity={0.25}
    />
  )
}
