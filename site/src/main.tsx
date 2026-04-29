import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import { Home } from "./Home"
import { preRegisterRenderNodes } from "./instrumentation/preRegisterRenderNodes"

// Eagerly register all stores so their Zustand nodes are in the graph before paint
import "./store/authStore"
import "./store/searchStore"
import "./store/toggleStore"
import "./hooks/useTabQueries"

preRegisterRenderNodes()

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Home />
  </React.StrictMode>
)
