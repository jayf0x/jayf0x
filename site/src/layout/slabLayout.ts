import type { RegistryNode, RegistryEdge } from "../store/registryStore"
import { SLABS } from "./slabs"
import { layoutRenderTree } from "./renderTreeLayout"
import { layoutZustand } from "./zustandLayout"
import { layoutReactQuery } from "./reactQueryLayout"

export function computeAllPositions(
  nodes: Record<string, RegistryNode>,
  edges: RegistryEdge[],
): Record<string, [number, number, number]> {
  const list = Object.values(nodes)
  const nodeSet = (slab: RegistryNode["slab"]) => list.filter((n) => n.slab === slab)
  const edgeSet = (slabNodes: RegistryNode[]) => {
    const ids = new Set(slabNodes.map((n) => n.id))
    return edges.filter((e) => ids.has(e.sourceId) && ids.has(e.targetId))
  }

  const renderNodes = nodeSet("RENDER_TREE")
  const zustandNodes = nodeSet("ZUSTAND")
  const queryNodes = nodeSet("REACT_QUERY")

  return {
    ...layoutRenderTree(renderNodes, edgeSet(renderNodes), SLABS.RENDER_TREE),
    ...layoutZustand(zustandNodes, edgeSet(zustandNodes), SLABS.ZUSTAND),
    ...layoutReactQuery(queryNodes, edgeSet(queryNodes), SLABS.REACT_QUERY),
  }
}
