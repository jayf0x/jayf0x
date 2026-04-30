import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Github, Download, Lock } from "lucide-react"
import { useRepositories } from "../hooks/useRepository"
import { Skeleton } from "../components/Skeleton"

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.2 },
}

export const ProjectSection = () => {
  const { isLoading, repositories, error } = useRepositories()
  const [query, setQuery] = useState("")

  const filtered = repositories.filter((r) => {
    const q = query.toLowerCase()
    return (
      r.name.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.tags.some((t) => t.toLowerCase().includes(q))
    )
  })

  return (
    <section className="px-6 pb-32">
      <div className="mx-auto max-w-3xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative"
        >
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
          <input
            type="text"
            placeholder="Search projects…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 pl-10 pr-4 text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--accent)]"
          />
        </motion.div>

        {isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
            Unable to load repositories: {error}
          </p>
        )}

        {!isLoading && !error && (
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.p key="empty" {...fadeUp} className="py-8 text-center text-sm text-[var(--muted)]">
                No projects match "{query}"
              </motion.p>
            ) : (
              filtered.map((repo) => (
                <motion.div
                  key={repo.name}
                  layout
                  {...fadeUp}
                  className="group flex items-start justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--accent)]"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-[var(--text)]">{repo.name}</h3>
                      {repo.isPrivate && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-0.5 font-mono text-[11px] text-[var(--muted)]">
                          <Lock size={10} /> private
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-[var(--muted)]">{repo.description}</p>
                    <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-[var(--muted)]">
                      {repo.language && (
                        <span className="rounded-full border border-[var(--border)] px-2 py-0.5">{repo.language}</span>
                      )}
                      {repo.stars !== undefined && (
                        <span className="rounded-full border border-[var(--border)] px-2 py-0.5">★ {repo.stars}</span>
                      )}
                      {repo.pushedAt && (
                        <span className="rounded-full border border-[var(--border)] px-2 py-0.5">{repo.pushedAt}</span>
                      )}
                      {repo.tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-[var(--border)] px-2 py-0.5">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {!repo.isPrivate && repo.url && (
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-[var(--border)] p-2 text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--text)]"
                      >
                        <Github size={15} />
                      </a>
                    )}
                    {repo.downloadUrl && (
                      <a
                        href={repo.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--accent)] bg-[var(--accent-glow)] px-2 py-1 font-mono text-xs text-[var(--text)]"
                      >
                        <Download size={11} /> macOS
                      </a>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        )}
      </div>
    </section>
  )
}
