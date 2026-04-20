import React from "react"
import ReactDOM from "react-dom/client"
import { RouterProvider } from "react-router-dom"
import { Background } from "./components/Background"
import { ThemeToggle } from "./components/ThemeToggle"
import { ThemeProvider } from "./context/ThemeContext"
import { router } from "./routes"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <div className="min-h-screen w-full text-[var(--text)]">
        <Background />
        <ThemeToggle />
        <main className="relative z-10">
          <RouterProvider router={router} />
        </main>
      </div>
    </ThemeProvider>
  </React.StrictMode>
)
