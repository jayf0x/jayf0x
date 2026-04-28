import { queue } from "./queue"

export function useEventTracker(nodeId: string) {
  function track(): string {
    const cascadeId = queue.newCascade()
    queue.emit("USER_EVENT", nodeId, cascadeId)
    return cascadeId
  }
  return { track }
}
