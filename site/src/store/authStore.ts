import { create } from "zustand"
import { queue } from "../instrumentation/queue"
import { useRegistryStore } from "./registryStore"

const reg = useRegistryStore.getState()
reg.registerNode({ id: "auth-store",    label: "authStore",     type: "STORE",  slab: "ZUSTAND" })
reg.registerNode({ id: "auth-user",     label: "username",      type: "SLICE",  slab: "ZUSTAND", parentId: "auth-store" })
reg.registerNode({ id: "auth-pass",     label: "password",      type: "SLICE",  slab: "ZUSTAND", parentId: "auth-store" })
reg.registerNode({ id: "set-auth-user", label: "setUsername",   type: "ACTION", slab: "ZUSTAND", parentId: "auth-user" })
reg.registerNode({ id: "set-auth-pass", label: "setPassword",   type: "ACTION", slab: "ZUSTAND", parentId: "auth-pass" })
reg.registerEdge("auth-store", "auth-user")
reg.registerEdge("auth-store", "auth-pass")
reg.registerEdge("auth-user",  "set-auth-user")
reg.registerEdge("auth-pass",  "set-auth-pass")

interface AuthState {
  username: string
  password: string
  setUsername: (v: string, cascadeId?: string) => void
  setPassword: (v: string, cascadeId?: string) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  username: "",
  password: "",
  setUsername(v, cascadeId) {
    queue.emit("STATE_UPDATE", "set-auth-user", cascadeId)
    set({ username: v })
  },
  setPassword(v, cascadeId) {
    queue.emit("STATE_UPDATE", "set-auth-pass", cascadeId)
    set({ password: v })
  },
}))
