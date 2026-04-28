import { create } from "zustand"
import { queue } from "../instrumentation/queue"
import { useRegistryStore } from "./registryStore"

const reg = useRegistryStore.getState()

reg.registerNode({ id: "form-store",    label: "formStore",   type: "STORE",  slab: "ZUSTAND" })
reg.registerNode({ id: "username-slice", label: "username",   type: "SLICE",  slab: "ZUSTAND", parentId: "form-store" })
reg.registerNode({ id: "email-slice",    label: "email",      type: "SLICE",  slab: "ZUSTAND", parentId: "form-store" })
reg.registerNode({ id: "role-slice",     label: "role",       type: "SLICE",  slab: "ZUSTAND", parentId: "form-store" })
reg.registerNode({ id: "set-username",   label: "setUsername", type: "ACTION", slab: "ZUSTAND", parentId: "username-slice" })
reg.registerNode({ id: "set-email",      label: "setEmail",   type: "ACTION", slab: "ZUSTAND", parentId: "email-slice" })
reg.registerNode({ id: "set-role",       label: "setRole",    type: "ACTION", slab: "ZUSTAND", parentId: "role-slice" })

reg.registerEdge("form-store",    "username-slice")
reg.registerEdge("form-store",    "email-slice")
reg.registerEdge("form-store",    "role-slice")
reg.registerEdge("username-slice", "set-username")
reg.registerEdge("email-slice",    "set-email")
reg.registerEdge("role-slice",     "set-role")

interface FormState {
  username: string
  email: string
  role: string
  setUsername: (v: string, cascadeId?: string) => void
  setEmail:    (v: string, cascadeId?: string) => void
  setRole:     (v: string, cascadeId?: string) => void
}

export const useFormStore = create<FormState>((set) => ({
  username: "",
  email: "",
  role: "viewer",

  setUsername(v, cascadeId) {
    queue.emit("STATE_UPDATE", "set-username", cascadeId)
    set({ username: v })
  },
  setEmail(v, cascadeId) {
    queue.emit("STATE_UPDATE", "set-email", cascadeId)
    set({ email: v })
  },
  setRole(v, cascadeId) {
    queue.emit("STATE_UPDATE", "set-role", cascadeId)
    set({ role: v })
  },
}))
