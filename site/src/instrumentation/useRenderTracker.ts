import { useEffect } from "react"
import { queue } from "./queue"
import { useRegistryStore } from "../store/registryStore"

export function useRenderTracker(nodeId: string, label: string, parentId?: string): void {
  // Registration is idempotent — node stays in the tree even when component unmounts.
  // Pre-registration in preRegisterRenderNodes() covers the initial layout.
  useEffect(() => {
    const reg = useRegistryStore.getState()
    reg.registerNode({ id: nodeId, label, type: "COMPONENT", slab: "RENDER_TREE", parentId })
    if (parentId) reg.registerEdge(parentId, nodeId)
  }, [nodeId, label, parentId])

  // Emit RENDER after every render — no dep array is intentional
  useEffect(() => {
    queue.emit("RENDER", nodeId)
  })
}
