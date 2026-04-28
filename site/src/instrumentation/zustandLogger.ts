import type { StateCreator } from "zustand"
import { queue } from "./queue"

// Middleware that emits a STATE_UPDATE event on every set() call.
// Pass the registry nodeId that corresponds to this store or action.
// Usage: create(zustandLogger(creator, "my-store-node-id"))
export function zustandLogger<T>(
  creator: StateCreator<T, [], []>,
  nodeId: string,
): StateCreator<T, [], []> {
  return (set, get, store) =>
    creator(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (partial: any, replace?: any) => {
        queue.emit("STATE_UPDATE", nodeId)
        set(partial, replace)
      },
      get,
      store,
    )
}
