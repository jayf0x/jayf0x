import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Github, Download, ExternalLink } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useRepoSearch } from "../hooks/useRepoSearch"
import { withLocalStorageCache } from "../lib/queryClient"
import { fetchRepoDetails, fetchLatestDmgUrl } from "../utils/fetch-repository"
import type { RepoEntry, RepoDetails } from "../types/repository"

const OWNER = "jayf0x"
const FIVE_HOURS = 5 * 60 * 60 * 1000

// ── chip ────────────────────────────────────────────────────────────────────

type ChipProps = {
  label: string
  active: boolean
  onToggle: () => void
}

const Chip = ({ label, active, onToggle }: ChipProps) => (
  <button
    type="button"
    onClick={onToggle}
    className={`shrink-0 rounded-full border px-3 py-1 font-mono text-xs transition ${
      active
        ? "border-[var(--accent)] bg-[var(--accent-glow)] text-[var(--text)]"
        : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)]"
    }`}
  >
    {label}
  </button>
)

// ── card ─────────────────────────────────────────────────────────────────────

const timeSince = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const m = 60_000, h = 60 * m, d = 24 * h
  if (diff < h) return `${Math.max(1, Math.floor(diff / m))}m ago`
  if (diff < d) return `${Math.floor(diff / h)}h ago`
  return `${Math.floor(diff / d)}d ago`
}

type RepoCardProps = { entry: RepoEntry; index: number }

const RepoCard = ({ entry, index }: RepoCardProps) => {
  const { data: details } = useQuery<RepoDetails>({
    queryKey: ["repo", OWNER, entry.repo],
    queryFn: () =>
      withLocalStorageCache(`gh:${OWNER}:${entry.repo}`, FIVE_HOURS, async () => {
        const [base, downloadUrl] = await Promise.all([
          fetchRepoDetails(OWNER, entry.repo),
          fetchLatestDmgUrl(OWNER, entry.repo),
        ])
        return { ...base, downloadUrl: downloadUrl || undefined }
      }),
  })

  const tags = [...new Set([...entry.stack, ...entry.types])]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className="group flex items-start justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--accent)]"
    >
      <div className="min-w-0 flex-1 space-y-2">
        <h3 className="text-base font-semibold text-[var(--text)]">{entry.repo}</h3>

        <p className="text-sm leading-relaxed text-[var(--muted)]">
          {entry.repo_description}
        </p>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-[var(--muted)]">
          {details?.language && (
            <span className="rounded-full border border-[var(--border)] px-2 py-0.5">
              {details.language}
            </span>
          )}
          {details?.stars !== undefined && (
            <span className="rounded-full border border-[var(--border)] px-2 py-0.5">
              ★ {details.stars}
            </span>
          )}
          {details?.pushedAt && (
            <span className="rounded-full border border-[var(--border)] px-2 py-0.5">
              {timeSince(details.pushedAt)}
            </span>
          )}
          {tags.map((tag) => (
            <span key={tag} className="rounded-full border border-[var(--border)] px-2 py-0.5">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        {details?.url && (
          <a
            href={details.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[var(--border)] p-2 text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--text)]"
          >
            <Github size={15} />
          </a>
        )}
        {details?.downloadUrl && (
          <a
            href={details.downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-[var(--accent)] bg-[var(--accent-glow)] px-2 py-1 font-mono text-xs text-[var(--text)]"
          >
            <Download size={11} /> macOS
          </a>
        )}
      </div>
    </motion.div>
  )
}

// ── section ───────────────────────────────────────────────────────────────────

export const ProjectSection = () => {
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<Set<string>>(new Set())

  const { results, allStacks, allTypes } = useRepoSearch(query, filters)

  const toggleFilter = (value: string) =>
    setFilters((prev) => {
      const next = new Set(prev)
      next.has(value) ? next.delete(value) : next.add(value)
      return next
    })

  const hasInput = query.trim().length > 0 || filters.size > 0

  return (
    <section className="flex-1 px-6 pb-32 flex-1">
      <div className="mx-auto max-w-3xl space-y-5">

        {/* Search bar */}
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

        {/* Filter chips — single scrollable row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {[...allStacks, ...allTypes].map((label) => (
            <Chip
              key={label}
              label={label}
              active={filters.has(label)}
              onToggle={() => toggleFilter(label)}
            />
          ))}
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="popLayout">
          {hasInput && results.length === 0 && (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center text-sm text-[var(--muted)]"
            >
              No projects match.
            </motion.p>
          )}

          {hasInput && results.length > 0 && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {results.map((entry, i) => (
                <RepoCard key={entry.repo} entry={entry} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  )
}
