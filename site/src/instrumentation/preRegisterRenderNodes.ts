import { useRegistryStore } from "../store/registryStore"

// Registers every COMPONENT node for all tabs up-front so the render tree
// slab shows a stable, full graph regardless of which tab is active.
// useRenderTracker handles RENDER event emission at runtime.
export function preRegisterRenderNodes(): void {
  const reg = useRegistryStore.getState()

  const node = (id: string, label: string, parentId?: string) =>
    reg.registerNode({ id, label, type: "COMPONENT", slab: "RENDER_TREE", parentId })
  const edge = (a: string, b: string) => reg.registerEdge(a, b)

  // Root
  node("left-panel", "LeftPanel")

  // Button tab
  node("tab-btn", "TabButton", "left-panel")
  edge("left-panel", "tab-btn")

  // LoginForm tab
  node("login-form",     "LoginForm",      "left-panel")
  node("login-username", "UsernameField",  "login-form")
  node("login-password", "PasswordField",  "login-form")
  node("login-submit",   "LoginSubmit",    "login-form")
  edge("left-panel",  "login-form")
  edge("login-form",  "login-username")
  edge("login-form",  "login-password")
  edge("login-form",  "login-submit")

  // SearchInput tab
  node("search-input", "SearchInput", "left-panel")
  edge("left-panel", "search-input")

  // Toggle tab
  node("toggle-panel", "TogglePanel", "left-panel")
  edge("left-panel", "toggle-panel")
}
