import { create } from "zustand"
import { computeAllPositions } from "../layout/slabLayout"

export type NodeType =
  | "COMPONENT"
  | "STORE"
  | "SLICE"
  | "ACTION"
  | "QUERY_KEY"
  | "QUERY_LOADING"
  | "QUERY_RESULT"

// Semantic role — used for visual treatment and thread routing.
// "view" / "method" / "query" are connectable (thread line endpoints).
// "store" / "property" / "loading" / "result" are structural / status nodes.
export type NodeRole = "view" | "store" | "property" | "method" | "query" | "loading" | "result"

export const CONNECTABLE_ROLES: Set<NodeRole> = new Set(["view", "method", "query"])

// Derived automatically from NodeType unless overridden at registration time.
const DEFAULT_ROLE: Record<NodeType, NodeRole> = {
  COMPONENT:     "view",
  STORE:         "store",
  SLICE:         "property",
  ACTION:        "method",
  QUERY_KEY:     "query",
  QUERY_LOADING: "loading",
  QUERY_RESULT:  "result",
}

export type SlabType = "RENDER_TREE" | "ZUSTAND" | "REACT_QUERY"

export interface RegistryNode {
  id: string
  label: string
  type: NodeType
  role: NodeRole        // semantic role for visual treatment + thread routing
  slab: SlabType
  parentId?: string
  position: [number, number, number]
}

export interface RegistryEdge {
  sourceId: string
  targetId: string
}

interface RegistryState {
  nodes: Record<string, RegistryNode>
  edges: RegistryEdge[]
  registerNode: (node: Omit<RegistryNode, "position" | "role"> & { role?: NodeRole }) => void
  registerEdge: (sourceId: string, targetId: string) => void
  unregisterNode: (id: string) => void
  clearCrossSlabEdges: () => void
  triggerLayout: () => void
}

let layoutTimer: ReturnType<typeof setTimeout> | null = null

export const useRegistryStore = create<RegistryState>((set, get) => ({
  nodes: {},
  edges: [],

  registerNode(nodeSpec) {
    if (get().nodes[nodeSpec.id]) return
    const role = nodeSpec.role ?? DEFAULT_ROLE[nodeSpec.type]
    set((state) => ({
      nodes: {
        ...state.nodes,
        [nodeSpec.id]: { ...nodeSpec, role, position: [0, 0, 0] },
      },
    }))
    get().triggerLayout()
  },

  registerEdge(sourceId, targetId) {
    const already = get().edges.some(
      (e) => e.sourceId === sourceId && e.targetId === targetId,
    )
    if (already) return
    set((state) => ({
      edges: [...state.edges, { sourceId, targetId }],
    }))
  },

  clearCrossSlabEdges() {
    set((state) => ({
      edges: state.edges.filter((e) => {
        const src = state.nodes[e.sourceId]
        const tgt = state.nodes[e.targetId]
        return !src || !tgt || src.slab === tgt.slab
      }),
    }))
  },

  unregisterNode(id) {
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _removed, ...rest } = state.nodes
      return {
        nodes: rest,
        edges: state.edges.filter((e) => e.sourceId !== id && e.targetId !== id),
      }
    })
    get().triggerLayout()
  },

  triggerLayout() {
    if (layoutTimer) clearTimeout(layoutTimer)
    layoutTimer = setTimeout(() => {
      const { nodes, edges } = get()
      const positions = computeAllPositions(nodes, edges)
      if (Object.keys(positions).length === 0) return
      set((state) => ({
        nodes: Object.fromEntries(
          Object.entries(state.nodes).map(([id, node]) => [
            id,
            positions[id] ? { ...node, position: positions[id] } : node,
          ]),
        ),
      }))
    }, 50)
  },
}))
