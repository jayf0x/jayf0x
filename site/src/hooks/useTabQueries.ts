import { queue } from "../instrumentation/queue"
import { useRegistryStore } from "../store/registryStore"

const reg = useRegistryStore.getState()

// Button tab
reg.registerNode({ id: "q-btn-key",     label: "buttonClick",  type: "QUERY_KEY",     slab: "REACT_QUERY" })
reg.registerNode({ id: "q-btn-loading", label: "loading",      type: "QUERY_LOADING", slab: "REACT_QUERY", parentId: "q-btn-key" })
reg.registerNode({ id: "q-btn-result",  label: "result",       type: "QUERY_RESULT",  slab: "REACT_QUERY", parentId: "q-btn-loading" })
reg.registerEdge("q-btn-key",     "q-btn-loading")
reg.registerEdge("q-btn-loading", "q-btn-result")

// Login tab
reg.registerNode({ id: "q-login-key",     label: "authenticate", type: "QUERY_KEY",     slab: "REACT_QUERY" })
reg.registerNode({ id: "q-login-loading", label: "loading",      type: "QUERY_LOADING", slab: "REACT_QUERY", parentId: "q-login-key" })
reg.registerNode({ id: "q-login-result",  label: "result",       type: "QUERY_RESULT",  slab: "REACT_QUERY", parentId: "q-login-loading" })
reg.registerEdge("q-login-key",     "q-login-loading")
reg.registerEdge("q-login-loading", "q-login-result")

// Search tab
reg.registerNode({ id: "q-search-key",     label: "search",    type: "QUERY_KEY",     slab: "REACT_QUERY" })
reg.registerNode({ id: "q-search-loading", label: "loading",   type: "QUERY_LOADING", slab: "REACT_QUERY", parentId: "q-search-key" })
reg.registerNode({ id: "q-search-result",  label: "result",    type: "QUERY_RESULT",  slab: "REACT_QUERY", parentId: "q-search-loading" })
reg.registerEdge("q-search-key",     "q-search-loading")
reg.registerEdge("q-search-loading", "q-search-result")

// Toggle tab
reg.registerNode({ id: "q-prefs-key",     label: "savePrefs", type: "QUERY_KEY",     slab: "REACT_QUERY" })
reg.registerNode({ id: "q-prefs-loading", label: "loading",   type: "QUERY_LOADING", slab: "REACT_QUERY", parentId: "q-prefs-key" })
reg.registerNode({ id: "q-prefs-result",  label: "result",    type: "QUERY_RESULT",  slab: "REACT_QUERY", parentId: "q-prefs-loading" })
reg.registerEdge("q-prefs-key",     "q-prefs-loading")
reg.registerEdge("q-prefs-loading", "q-prefs-result")

// Cross-slab threads
reg.registerEdge("tab-btn",      "q-btn-key")
reg.registerEdge("login-submit", "auth-store")
reg.registerEdge("auth-store",   "q-login-key")
reg.registerEdge("search-input", "search-store")
reg.registerEdge("search-store", "q-search-key")
reg.registerEdge("toggle-panel", "toggle-store")
reg.registerEdge("toggle-store", "q-prefs-key")

function mockRun(keyId: string, resultId: string, delayMs: number, cascadeId: string): Promise<void> {
  queue.emit("QUERY_START", keyId, cascadeId)
  return new Promise((resolve) =>
    setTimeout(() => {
      queue.emit("QUERY_SUCCESS", resultId, cascadeId)
      resolve()
    }, delayMs),
  )
}

export function useButtonQuery() {
  return {
    run: (cascadeId: string) => mockRun("q-btn-key", "q-btn-result", 800, cascadeId),
  }
}

export function useLoginQuery() {
  return {
    run: (cascadeId: string) => mockRun("q-login-key", "q-login-result", 1100, cascadeId),
  }
}

export function useSearchQuery() {
  return {
    run: (cascadeId: string) => mockRun("q-search-key", "q-search-result", 600, cascadeId),
  }
}

export function usePrefsQuery() {
  return {
    run: (cascadeId: string) => mockRun("q-prefs-key", "q-prefs-result", 700, cascadeId),
  }
}
