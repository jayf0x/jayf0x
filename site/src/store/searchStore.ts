import { create } from "zustand"
import { queue } from "../instrumentation/queue"
import { useRegistryStore } from "./registryStore"

const reg = useRegistryStore.getState()
reg.registerNode({ id: "search-store", label: "searchStore", type: "STORE",  slab: "ZUSTAND" })
reg.registerNode({ id: "search-query", label: "query",       type: "SLICE",  slab: "ZUSTAND", parentId: "search-store" })
reg.registerNode({ id: "set-query",    label: "setQuery",    type: "ACTION", slab: "ZUSTAND", parentId: "search-query" })
reg.registerEdge("search-store", "search-query")
reg.registerEdge("search-query", "set-query")

interface SearchState {
  query: string
  setQuery: (v: string, cascadeId?: string) => void
}

export const useSearchStore = create<SearchState>((set) => ({
  query: "",
  setQuery(v, cascadeId) {
    queue.emit("STATE_UPDATE", "set-query", cascadeId)
    set({ query: v })
  },
}))
