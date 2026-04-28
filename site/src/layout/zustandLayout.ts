import { hierarchy, tree } from "d3-hierarchy"
import type { RegistryNode, RegistryEdge } from "../store/registryStore"
import type { Slab } from "./slabs"

// Multiple stores spread horizontally; each store tree laid out in its own column.
// d3.x → world X (within column), d3.y → world Z, world Y = slab center Y.
export function layoutZustand(
  nodes: RegistryNode[],
  edges: RegistryEdge[],
  slab: Slab,
): Record<string, [number, number, number]> {
  if (nodes.length === 0) return {}

  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]))
  const childrenOf: Record<string, RegistryNode[]> = {}
  for (const n of nodes) childrenOf[n.id] = []
  for (const e of edges) {
    if (childrenOf[e.sourceId] && nodeById[e.targetId]) {
      childrenOf[e.sourceId].push(nodeById[e.targetId])
    }
  }

  // Roots = STORE nodes (no incoming edge within this slab)
  const childIds = new Set(edges.map((e) => e.targetId))
  const roots = nodes.filter((n) => !childIds.has(n.id))
  if (roots.length === 0) return fallbackRow(nodes, slab)

  const [w, , d] = slab.size
  const lw = w * 0.8
  const ld = d * 0.8
  const colW = lw / roots.length

  const result: Record<string, [number, number, number]> = {}

  roots.forEach((root, ri) => {
    const colCenterX = slab.center[0] - lw / 2 + colW * (ri + 0.5)
    const hier = hierarchy(root, (n) => childrenOf[n.id])
    const layout = tree<RegistryNode>().size([colW * 0.85, ld])
    const positioned = layout(hier)

    positioned.each((node) => {
      result[node.data.id] = [
        colCenterX + node.x - colW * 0.425,
        slab.center[1],
        slab.center[2] + node.y - ld / 2,
      ]
    })
  })

  return result
}

function fallbackRow(
  nodes: RegistryNode[],
  slab: Slab,
): Record<string, [number, number, number]> {
  const [w] = slab.size
  const step = (w * 0.8) / (nodes.length + 1)
  return Object.fromEntries(
    nodes.map((n, i) => [
      n.id,
      [slab.center[0] - (w * 0.8) / 2 + step * (i + 1), slab.center[1], slab.center[2]] as [
        number,
        number,
        number,
      ],
    ]),
  )
}
