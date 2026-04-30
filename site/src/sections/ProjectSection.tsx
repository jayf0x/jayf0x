import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Github, Download, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRepoSearch } from "../hooks/useRepoSearch";
import { withLocalStorageCache } from "../lib/queryClient";
import { fetchRepoDetails, fetchLatestDmgUrl } from "../utils/fetch-repository";
import { getStackMeta } from "../lib/stackMeta";
import type { RepoEntry, RepoDetails } from "../types/repository";

const OWNER = "jayf0x";
const FIVE_HOURS = 5 * 60 * 60 * 1000;

// ── spring presets ────────────────────────────────────────────────────────────

const spring = { type: "spring" as const, stiffness: 500, damping: 40 };
const springGentle = { type: "spring" as const, stiffness: 320, damping: 32 };

// ── stack badge ───────────────────────────────────────────────────────────────

const StackBadge = ({ name, size = "sm" }: { name: string; size?: "sm" | "xs" }) => {
  const m = getStackMeta(name);
  const px = size === "xs" ? "px-1.5 py-0" : "px-2 py-0.5";
  const text = size === "xs" ? "text-[10px]" : "text-xs";
  return (
    <span
      className={`inline-block shrink-0 rounded font-mono font-medium ${px} ${text}`}
      style={{ background: m.bg === "transparent" ? "rgba(255,255,255,0.06)" : m.bg, color: m.color }}
    >
      {m.label || name}
    </span>
  );
};

// ── filter chip ───────────────────────────────────────────────────────────────

const FilterChip = ({
  name,
  active,
  onToggle,
}: {
  name: string;
  active: boolean;
  onToggle: () => void;
}) => {
  const m = getStackMeta(name);
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs transition-all duration-150 ${
        active
          ? "border-[var(--accent)] bg-[var(--accent-glow)] text-[var(--text)]"
          : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)]"
      }`}
    >
      {m.bg !== "transparent" && (
        <span
          className="inline-block h-2 w-2 rounded-sm"
          style={{ background: m.bg }}
        />
      )}
      {name}
    </button>
  );
};

// ── chip row ──────────────────────────────────────────────────────────────────

const ChipRow = ({
  label,
  items,
  filters,
  onToggle,
}: {
  label: string;
  items: string[];
  filters: Set<string>;
  onToggle: (v: string) => void;
}) => (
  <div className="flex items-center gap-2">
    <span className="w-10 shrink-0 text-right font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
      {label}
    </span>
    <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((name) => (
        <FilterChip
          key={name}
          name={name}
          active={filters.has(name)}
          onToggle={() => onToggle(name)}
        />
      ))}
    </div>
  </div>
);

// ── card ──────────────────────────────────────────────────────────────────────

const timeSince = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = 60_000, h = 60 * m, d = 24 * h;
  if (diff < h) return `${Math.max(1, Math.floor(diff / m))}m ago`;
  if (diff < d) return `${Math.floor(diff / h)}h ago`;
  return `${Math.floor(diff / d)}d ago`;
};

const RepoCard = ({ entry }: { entry: RepoEntry }) => {
  const { data: details } = useQuery<RepoDetails>({
    queryKey: ["repo", OWNER, entry.repo],
    queryFn: () =>
      withLocalStorageCache(`gh:${OWNER}:${entry.repo}`, FIVE_HOURS, async () => {
        const [base, downloadUrl] = await Promise.all([
          fetchRepoDetails(OWNER, entry.repo),
          fetchLatestDmgUrl(OWNER, entry.repo),
        ]);
        return { ...base, downloadUrl: downloadUrl || undefined };
      }),
  });

  return (
    <div className="group flex items-start justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors duration-150 hover:border-[var(--accent)]">
      <div className="min-w-0 flex-1 space-y-2">
        {/* title row */}
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--text)]">{entry.repo}</h3>
          {details?.stars !== undefined && details.stars > 0 && (
            <span className="font-mono text-xs text-[var(--muted)]">★ {details.stars}</span>
          )}
          {details?.pushedAt && (
            <span className="font-mono text-xs text-[var(--muted)]">· {timeSince(details.pushedAt)}</span>
          )}
        </div>

        {/* description */}
        <p className="text-sm leading-snug text-[var(--muted)]">{entry.repo_description}</p>

        {/* stack badges */}
        <div className="flex flex-wrap gap-1.5">
          {entry.stack.map((s) => (
            <StackBadge key={s} name={s} size="xs" />
          ))}
          {entry.types.map((t) => (
            <span
              key={t}
              className="rounded-full border border-[var(--border)] px-2 py-0 font-mono text-[10px] text-[var(--muted)]"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* actions */}
      <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
        {details?.url && (
          <a
            href={details.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[var(--border)] p-1.5 text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text)]"
          >
            <Github size={13} />
          </a>
        )}
        {details?.downloadUrl && (
          <a
            href={details.downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-[var(--accent)] bg-[var(--accent-glow)] px-2 py-0.5 font-mono text-[10px] text-[var(--text)]"
          >
            <Download size={10} /> macOS
          </a>
        )}
      </div>
    </div>
  );
};

// ── section ───────────────────────────────────────────────────────────────────

export const ProjectSection = () => {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const { results, allStacks, allTypes } = useRepoSearch(query, filters);

  const toggleFilter = (value: string) =>
    setFilters((prev) => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });

  const clearAll = () => {
    setQuery("");
    setFilters(new Set());
    inputRef.current?.focus();
  };

  const hasInput = query.trim().length > 0 || filters.size > 0;
  const hasActiveFilters = filters.size > 0;

  return (
    <section className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
      <div className="mx-auto max-w-3xl space-y-4">

        {/* ── Search bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springGentle}
          className="relative"
        >
          <Search
            size={15}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search projects by name, keyword, stack…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 pl-10 pr-10 text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none transition-colors duration-150 focus:border-[var(--accent)]"
          />
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={spring}
                type="button"
                onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--muted)] transition-colors hover:text-[var(--text)]"
              >
                <X size={13} />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Filter chips ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...springGentle, delay: 0.08 }}
          className="space-y-2"
        >
          <ChipRow label="Stack" items={allStacks} filters={filters} onToggle={toggleFilter} />
          <ChipRow label="Type"  items={allTypes}  filters={filters} onToggle={toggleFilter} />
        </motion.div>

        {/* ── Meta row: count + clear ── */}
        <AnimatePresence>
          {hasInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={springGentle}
              className="flex items-center justify-between overflow-hidden"
            >
              <span className="font-mono text-xs text-[var(--muted)]">
                {results.length} {results.length === 1 ? "project" : "projects"}
                {hasActiveFilters && ` · ${filters.size} filter${filters.size > 1 ? "s" : ""} active`}
              </span>
              <button
                type="button"
                onClick={clearAll}
                className="font-mono text-xs text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
              >
                clear all
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results ── */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {hasInput && results.length === 0 && (
              <motion.p
                key="empty"
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={springGentle}
                className="py-10 text-center font-mono text-sm text-[var(--muted)]"
              >
                No matches.
              </motion.p>
            )}

            {results.map((entry, i) => (
              <motion.div
                key={entry.repo}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.12 } }}
                transition={{ ...spring, delay: i * 0.025 }}
              >
                <RepoCard entry={entry} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};
