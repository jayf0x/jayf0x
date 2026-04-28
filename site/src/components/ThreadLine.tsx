import { Line, Line2Props } from "@react-three/drei"
import type { RegistryNode } from "../store/registryStore"
import { RefAttributes } from "react"

interface Props {
  source: RegistryNode
  target: RegistryNode
  ref: RefAttributes<Line2Props>['ref']
}

export function ThreadLine({ source, target, ref: lineRef }: Props) {
  return (
    <Line
      ref={lineRef}
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
