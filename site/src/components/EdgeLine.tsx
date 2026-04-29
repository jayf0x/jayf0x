import { useMemo } from "react"
import { BufferGeometry, Float32BufferAttribute } from "three"
import { SLABS } from "../layout/slabs"
import type { RegistryNode } from "../store/registryStore"

interface Props {
  source: RegistryNode
  target: RegistryNode
}

export function EdgeLine({ source, target }: Props) {
  const color = SLABS[source.slab].color

  const geo = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute(
      "position",
      new Float32BufferAttribute([...source.position, ...target.position], 3),
    )
    return g
  }, [source.position, target.position])

  return (
    <line geometry={geo}>
      <lineBasicMaterial color={color} transparent opacity={0.22} />
    </line>
  )
}
