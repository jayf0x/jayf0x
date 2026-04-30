import { NavLink } from "react-router-dom"

export const Navigation = () => {
  return (
    <nav className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-4 backdrop-blur-md">
      <span className="font-mono text-sm font-semibold text-[var(--text)]">jayf0x</span>
      <div className="flex items-center gap-6">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `text-sm transition ${isActive ? "text-[var(--text)]" : "text-[var(--muted)] hover:text-[var(--text)]"}`
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/resume"
          className={({ isActive }) =>
            `text-sm transition ${isActive ? "text-[var(--text)]" : "text-[var(--muted)] hover:text-[var(--text)]"}`
          }
        >
          Resume
        </NavLink>
      </div>
    </nav>
  )
}
