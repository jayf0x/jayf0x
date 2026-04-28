import { create } from "zustand"
import { queue } from "../instrumentation/queue"

export type NodeState = "IDLE" | "ACTIVE" | "DIMMED" | "SELECTED"

const CASCADE_HOP_DELAY = 80 // ms per hop in the causality chain
const DIM_AFTER = 800 // ms before transitioning ACTIVE → DIMMED

const EVENT_ORDER = [
  "USER_EVENT",
  "STATE_UPDATE",
  "RENDER",
  "QUERY_START",
  "QUERY_SUCCESS",
] as const

type OrderedEvent = (typeof EVENT_ORDER)[number]

function hopDelay(type: string): number {
  const idx = EVENT_ORDER.indexOf(type as OrderedEvent)
  return Math.max(0, idx) * CASCADE_HOP_DELAY
}

interface HighlightState {
  states: Record<string, NodeState>
  setNodeState: (nodeId: string, state: NodeState) => void
}

export const useHighlightStore = create<HighlightState>((set) => ({
  states: {},

  setNodeState(nodeId, state) {
    set((s) => ({ states: { ...s.states, [nodeId]: state } }))
  },
}))

queue.subscribe((event) => {
  setTimeout(() => {
    useHighlightStore.getState().setNodeState(event.nodeId, "ACTIVE")

    setTimeout(() => {
      const current = useHighlightStore.getState().states[event.nodeId]
      if (current === "ACTIVE") {
        useHighlightStore.getState().setNodeState(event.nodeId, "DIMMED")
      }
    }, DIM_AFTER)
  }, hopDelay(event.type))
})
