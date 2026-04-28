import { create } from "zustand"
import { queue } from "../instrumentation/queue"
import { useRegistryStore } from "./registryStore"

const reg = useRegistryStore.getState()
reg.registerNode({ id: "toggle-store",    label: "toggleStore",    type: "STORE",  slab: "ZUSTAND" })
reg.registerNode({ id: "notifs-slice",    label: "notifications",  type: "SLICE",  slab: "ZUSTAND", parentId: "toggle-store" })
reg.registerNode({ id: "dark-slice",      label: "darkMode",       type: "SLICE",  slab: "ZUSTAND", parentId: "toggle-store" })
reg.registerNode({ id: "analytics-slice", label: "analytics",      type: "SLICE",  slab: "ZUSTAND", parentId: "toggle-store" })
reg.registerNode({ id: "toggle-notifs",   label: "toggleNotifs",   type: "ACTION", slab: "ZUSTAND", parentId: "notifs-slice" })
reg.registerNode({ id: "toggle-dark",     label: "toggleDark",     type: "ACTION", slab: "ZUSTAND", parentId: "dark-slice" })
reg.registerNode({ id: "toggle-analytics",label: "toggleAnalytics",type: "ACTION", slab: "ZUSTAND", parentId: "analytics-slice" })
reg.registerEdge("toggle-store",    "notifs-slice")
reg.registerEdge("toggle-store",    "dark-slice")
reg.registerEdge("toggle-store",    "analytics-slice")
reg.registerEdge("notifs-slice",    "toggle-notifs")
reg.registerEdge("dark-slice",      "toggle-dark")
reg.registerEdge("analytics-slice", "toggle-analytics")

interface ToggleState {
  notifications: boolean
  darkMode: boolean
  analytics: boolean
  toggleNotifications: (cascadeId?: string) => void
  toggleDarkMode:      (cascadeId?: string) => void
  toggleAnalytics:     (cascadeId?: string) => void
}

export const useToggleStore = create<ToggleState>((set, get) => ({
  notifications: true,
  darkMode: true,
  analytics: false,
  toggleNotifications(cascadeId) {
    queue.emit("STATE_UPDATE", "toggle-notifs", cascadeId)
    set({ notifications: !get().notifications })
  },
  toggleDarkMode(cascadeId) {
    queue.emit("STATE_UPDATE", "toggle-dark", cascadeId)
    set({ darkMode: !get().darkMode })
  },
  toggleAnalytics(cascadeId) {
    queue.emit("STATE_UPDATE", "toggle-analytics", cascadeId)
    set({ analytics: !get().analytics })
  },
}))
