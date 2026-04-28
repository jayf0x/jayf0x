import { queue } from "../instrumentation/queue"
import { useRegistryStore } from "../store/registryStore"

const reg = useRegistryStore.getState()

reg.registerNode({ id: "q-profile-key",     label: "updateProfile", type: "QUERY_KEY",     slab: "REACT_QUERY" })
reg.registerNode({ id: "q-profile-loading", label: "loading",       type: "QUERY_LOADING", slab: "REACT_QUERY", parentId: "q-profile-key" })
reg.registerNode({ id: "q-profile-result",  label: "result",        type: "QUERY_RESULT",  slab: "REACT_QUERY", parentId: "q-profile-loading" })

reg.registerNode({ id: "q-perms-key",     label: "updatePerms", type: "QUERY_KEY",     slab: "REACT_QUERY" })
reg.registerNode({ id: "q-perms-loading", label: "loading",     type: "QUERY_LOADING", slab: "REACT_QUERY", parentId: "q-perms-key" })
reg.registerNode({ id: "q-perms-result",  label: "result",      type: "QUERY_RESULT",  slab: "REACT_QUERY", parentId: "q-perms-loading" })

reg.registerEdge("q-profile-key", "q-profile-loading")
reg.registerEdge("q-profile-loading", "q-profile-result")
reg.registerEdge("q-perms-key", "q-perms-loading")
reg.registerEdge("q-perms-loading", "q-perms-result")

// Cross-slab threads: submit-btn → form-store, form-store → q-profile-key
reg.registerEdge("submit-btn",  "form-store")
reg.registerEdge("set-role",    "q-profile-key")
reg.registerEdge("set-role",    "q-perms-key")

export function useFormQueries() {
  function runProfile(cascadeId: string): Promise<void> {
    queue.emit("QUERY_START", "q-profile-key", cascadeId)
    return new Promise((resolve) =>
      setTimeout(() => {
        queue.emit("QUERY_SUCCESS", "q-profile-result", cascadeId)
        resolve()
      }, 900),
    )
  }

  function runPerms(cascadeId: string): Promise<void> {
    queue.emit("QUERY_START", "q-perms-key", cascadeId)
    return new Promise((resolve) =>
      setTimeout(() => {
        queue.emit("QUERY_SUCCESS", "q-perms-result", cascadeId)
        resolve()
      }, 1400),
    )
  }

  return { runProfile, runPerms }
}
