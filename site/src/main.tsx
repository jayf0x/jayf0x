import React from "react"
import ReactDOM from "react-dom/client"
import { RouterProvider } from "react-router-dom"
import { Background } from "./components/Background"
import { router } from "./routes"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
      <div className="min-h-screen w-full text-[var(--text)]">
        <Background />
        <main className="relative z-10">
          <RouterProvider router={router} />
        </main>
      </div>
  </React.StrictMode>
)
