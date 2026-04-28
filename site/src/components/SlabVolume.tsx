import { useMemo } from "react"
import { Text } from "@react-three/drei"
import { EdgesGeometry, BoxGeometry } from "three"
import type { Slab } from "../layout/slabs"

const SLAB_LABELS: Record<string, string> = {
  RENDER_TREE:  "Render Tree",
  ZUSTAND:      "Zustand",
  REACT_QUERY:  "React Query",
}

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

  // Local-space coords relative to slab.center (the group position)
  const localBackZ = -(slab.size[2] / 2) - 0.02
  const localTopY  =  slab.size[1] / 2 - 0.15

  return (
    <group position={slab.center}>
      <lineSegments geometry={edgesGeo}>
        <lineBasicMaterial color={slab.color} transparent opacity={0.12} />
      </lineSegments>

      {/* Title on the back face, visible from front through the transparent box */}
      <Text
        position={[0, localTopY, localBackZ]}
        fontSize={0.28}
        color={slab.color}
        anchorX="center"
        anchorY="top"
        fillOpacity={0.18}
        letterSpacing={0.12}
      >
        {SLAB_LABELS[slab.id] ?? slab.id}
      </Text>
    </group>
  )
}
