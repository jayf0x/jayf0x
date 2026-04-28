import { create } from "zustand"
import { zustandLogger } from "../instrumentation/zustandLogger"
import { useRegistryStore } from "./registryStore"

const reg = useRegistryStore.getState()
reg.registerNode({ id: "demo-store",  label: "demoStore",  type: "STORE",  slab: "ZUSTAND" })
reg.registerNode({ id: "load-slice",  label: "isLoading",  type: "SLICE",  slab: "ZUSTAND", parentId: "demo-store" })
reg.registerNode({ id: "set-loading", label: "setLoading", type: "ACTION", slab: "ZUSTAND", parentId: "load-slice" })
reg.registerEdge("demo-store", "load-slice")
reg.registerEdge("load-slice", "set-loading")

interface DemoState {
  isLoading: boolean
  setLoading: (val: boolean) => void
}

export const useDemoStore = create<DemoState>(
  zustandLogger(
    (set) => ({
      isLoading: false,
      setLoading(val) {
        set({ isLoading: val })
      },
    }),
    "set-loading",
  ),
)
