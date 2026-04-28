import { queue } from "../instrumentation/queue"
import { useRegistryStore } from "../store/registryStore"

const QUERY_DELAY_MS = 1200

const reg = useRegistryStore.getState()
reg.registerNode({ id: "q-key",     label: "mockQuery", type: "QUERY_KEY",     slab: "REACT_QUERY" })
reg.registerNode({ id: "q-loading", label: "loading",   type: "QUERY_LOADING", slab: "REACT_QUERY", parentId: "q-key" })
reg.registerNode({ id: "q-result",  label: "result",    type: "QUERY_RESULT",  slab: "REACT_QUERY", parentId: "q-loading" })
reg.registerEdge("q-key", "q-loading")
reg.registerEdge("q-loading", "q-result")

export function useMockQuery() {
  function run(cascadeId: string): Promise<void> {
    // Capture cascadeId synchronously, close over it in the success callback
    queue.emit("QUERY_START", "q-key", cascadeId)
    return new Promise((resolve) => {
      setTimeout(() => {
        queue.emit("QUERY_SUCCESS", "q-result", cascadeId)
        resolve()
      }, QUERY_DELAY_MS)
    })
  }
  return { run }
}
