import { useScrollSpy } from "../../hooks/useScrollSpy"

type NavigationProps = {
  sectionIds: string[]
}

export const Navigation = ({ sectionIds }: NavigationProps) => {
  const activeSection = useScrollSpy(sectionIds)

  return (
    <nav
      className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 md:flex flex-col items-center gap-3"
      aria-label="Section navigation"
    >
      <div className="absolute h-full w-px bg-[var(--border)]" />
      {sectionIds.map((id) => {
        const active = activeSection === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
            }}
            aria-label={`Scroll to ${id}`}
            className={`relative z-10 h-3 w-3 rounded-full border transition ${
              active
                ? "border-[var(--accent)] bg-[var(--accent)]"
                : "border-[var(--muted)] bg-[var(--bg)] hover:border-[var(--text)]"
            }`}
          />
        )
      })}
    </nav>
  )
}
