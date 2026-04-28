import type { RegistryNode, RegistryEdge } from "../store/registryStore"
import type { Slab } from "./slabs"

// One linear chain per query key: key → loading → result, spread along Z.
// Multiple query keys spread horizontally across the slab.
export function layoutReactQuery(
  nodes: RegistryNode[],
  _edges: RegistryEdge[],
  slab: Slab,
): Record<string, [number, number, number]> {
  if (nodes.length === 0) return {}

  const [w, , d] = slab.size
  const lw = w * 0.8
  const ld = d * 0.8

  // Roots of each chain are QUERY_KEY nodes
  const queryKeys = nodes.filter((n) => n.type === "QUERY_KEY")
  if (queryKeys.length === 0) return fallbackRow(nodes, slab)

  const result: Record<string, [number, number, number]> = {}
  const colW = lw / queryKeys.length

  queryKeys.forEach((keyNode, ki) => {
    const chainX = slab.center[0] - lw / 2 + colW * (ki + 0.5)

    // Walk the chain via parentId linkage: key → loading → result
    const chain: RegistryNode[] = [keyNode]
    let current = keyNode
    for (let depth = 0; depth < 10; depth++) {
      const next = nodes.find((n) => n.parentId === current.id)
      if (!next) break
      chain.push(next)
      current = next
    }

    const zStep = chain.length > 1 ? ld / (chain.length - 1) : 0
    chain.forEach((n, ni) => {
      result[n.id] = [
        chainX,
        slab.center[1],
        slab.center[2] - ld / 2 + zStep * ni,
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
