import { hierarchy, tree } from "d3-hierarchy"
import type { RegistryNode, RegistryEdge } from "../store/registryStore"
import type { Slab } from "./slabs"

// Reingold-Tilford tree layout mapped into the slab's XZ plane.
// d3.x → world X, d3.y → world Z, world Y = slab center Y.
export function layoutRenderTree(
  nodes: RegistryNode[],
  edges: RegistryEdge[],
  slab: Slab,
): Record<string, [number, number, number]> {
  if (nodes.length === 0) return {}
  if (nodes.length === 1) {
    return { [nodes[0].id]: [...slab.center] as [number, number, number] }
  }

  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]))
  const childrenOf: Record<string, RegistryNode[]> = {}
  for (const n of nodes) childrenOf[n.id] = []
  for (const e of edges) {
    if (childrenOf[e.sourceId] && nodeById[e.targetId]) {
      childrenOf[e.sourceId].push(nodeById[e.targetId])
    }
  }

  const childIds = new Set(edges.map((e) => e.targetId))
  const root = nodes.find((n) => !childIds.has(n.id))
  if (!root) return fallbackRow(nodes, slab)

  const [w, , d] = slab.size
  const lw = w * 0.8
  const ld = d * 0.8

  const hier = hierarchy(root, (n: RegistryNode) => childrenOf[n.id])
  const layout = tree<RegistryNode>().size([lw, ld])
  const positioned = layout(hier)

  const result: Record<string, [number, number, number]> = {}
  positioned.each((node: { data: RegistryNode; x: number; y: number }) => {
    result[node.data.id] = [
      slab.center[0] + node.x - lw / 2,
      slab.center[1],
      slab.center[2] + node.y - ld / 2,
    ]
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
