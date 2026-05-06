import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRepoSearch } from "../../../hooks/useRepoSearch";
import { withLocalStorageCache } from "../../../lib/queryClient";
import { fetchUserRepos, type GithubRepo } from "../../../utils/fetch-repository";
import { RepoCard } from "./RepoCard";
import { CACHE_INVALIDATION_TIME, OWNER } from "../../../config";
import { FilterRow } from "./FilterRow";
import { Sidebar } from "./Sidebar";

const spring = { type: "spring" as const, stiffness: 500, damping: 40 };
const springGentle = { type: "spring" as const, stiffness: 320, damping: 32 };

export const ProjectSection = () => {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: repos = [], isLoading } = useQuery<GithubRepo[]>({
    queryKey: ["repos", OWNER],
    queryFn: () =>
      withLocalStorageCache(`gh:repos:${OWNER}`, CACHE_INVALIDATION_TIME, () =>
        fetchUserRepos(OWNER),
      ),
    staleTime: CACHE_INVALIDATION_TIME,
    gcTime: CACHE_INVALIDATION_TIME,
  });

  const { results, allStacks, allTopics } = useRepoSearch(
    repos,
    query,
    filters,
  );

  const toggleFilter = (value: string) =>
    setFilters((prev) => {
      const next = new Set(prev);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
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
    <section className="flex flex-col flex-1 min-h-0 px-6 py-4">
      <div className="mx-auto max-w-5xl flex flex-row min-h-0 gap-0 size-full">
        <Sidebar repos={repos} onSelect={setQuery} isLoading={isLoading} />
        <div className="flex-1 min-w-0 flex flex-col min-h-0 gap-4 pl-4">
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
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full p-1 text-[var(--muted)] transition-colors hover:text-[var(--text)]"
              >
                <X size={13} />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Filter chips ── */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...springGentle, delay: 0.08 }}
            className="space-y-2"
          >
            {allStacks.length > 0 && (
              <FilterRow
                label="Stack"
                items={allStacks}
                filters={filters}
                onToggle={toggleFilter}
              />
            )}
            {allTopics.length > 0 && (
              <FilterRow
                label="Topics"
                items={allTopics}
                filters={filters}
                onToggle={toggleFilter}
              />
            )}
          </motion.div>
        )}

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
                {hasActiveFilters &&
                  ` · ${filters.size} filter${filters.size > 1 ? "s" : ""} active`}
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
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
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

              {results.map((repo, i) => (
                <motion.div
                  key={repo.id}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{
                    opacity: 0,
                    scale: 0.97,
                    transition: { duration: 0.12 },
                  }}
                  transition={{ ...spring, delay: i * 0.025 }}
                >
                  <RepoCard repo={repo} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
        </div>
      </div>
    </section>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={`skeleton-${i}`}
        className="h-24 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface)]"
      />
    ))}
  </div>
);
