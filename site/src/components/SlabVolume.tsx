import { useMemo } from "react"
import { EdgesGeometry, BoxGeometry } from "three"
import type { Slab } from "../layout/slabs"

interface Props {
  slab: Slab
}

export function SlabVolume({ slab }: Props) {
  const edgesGeo = useMemo(() => {
    const box = new BoxGeometry(...slab.size)
    const edges = new EdgesGeometry(box)
    box.dispose()
    return edges
  }, [slab.size])

  return (
    <lineSegments
      geometry={edgesGeo}
      position={slab.center}
    >
      <lineBasicMaterial color={slab.color} transparent opacity={0.12} />
    </lineSegments>
  )
}
