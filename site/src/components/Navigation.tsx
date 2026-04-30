import type { Page } from "../App"

type NavigationProps = {
  current: Page
  onNavigate: (page: Page) => void
}

export const Navigation = ({ current, onNavigate }: NavigationProps) => {
  return (
    <nav className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-4 backdrop-blur-md">
      <button
        type="button"
        onClick={() => onNavigate("home")}
        className="font-mono text-sm font-semibold text-[var(--text)] transition hover:text-[var(--accent)]"
      >
        jayf0x
      </button>
      <div className="flex items-center gap-6">
        {(["home", "resume"] as Page[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onNavigate(p)}
            className={`text-sm capitalize transition ${
              current === p
                ? "text-[var(--text)]"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </nav>
  )
}
