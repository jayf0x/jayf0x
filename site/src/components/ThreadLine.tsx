import { Line } from "@react-three/drei"
import type { RegistryNode } from "../store/registryStore"

interface Props {
  source: RegistryNode
  target: RegistryNode
}

export function ThreadLine({ source, target }: Props) {
  return (
    <Line
      points={[source.position, target.position]}
      color="#ffffff"
      lineWidth={0.5}
      transparent
      opacity={0.12}
      dashed
      dashSize={0.15}
      gapSize={0.1}
    />
  )
}
