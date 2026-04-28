import type { SlabType } from "../store/registryStore"

export interface Slab {
  id: SlabType
  color: string
  center: [number, number, number]
  // width (x), height (y slab thickness), depth (z)
  size: [number, number, number]
}

// Slabs stack from y=0 (UI disc) down to y=-7
export const SLABS: Record<SlabType, Slab> = {
  RENDER_TREE: {
    id: "RENDER_TREE",
    color: "#4f9cf9",
    center: [0, -1.5, 0],
    size: [12, 2, 4],
  },
  ZUSTAND: {
    id: "ZUSTAND",
    color: "#a855f7",
    center: [0, -4, 0],
    size: [12, 2, 4],
  },
  REACT_QUERY: {
    id: "REACT_QUERY",
    color: "#22c55e",
    center: [0, -6.5, 0],
    size: [12, 1.5, 4],
  },
}
