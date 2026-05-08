import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRepoSearch } from "@/hooks/useRepoSearch";
import { withLocalStorageCache } from "@/lib/queryClient";
import {
  fetchUserRepos,
  type GithubRepo,
} from "@/utils/fetch-repository";
import { RepoCard } from "./RepoCard";
import { CACHE_INVALIDATION_TIME, OWNER } from "@/config";
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springGentle}
            className="relative"
          >
            <Search
              size={15}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-(--muted)"
            />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search projects by name, keyword, stack…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-(--border) bg-(--surface) py-3 pl-10 pr-10 text-sm text-(--text) placeholder:text-(--muted) outline-none transition-colors duration-150 focus:border-(--accent)"
            />
            <div className="absolute right-3 flex items-center top-0 h-full">
              <X
                size={13}
                className="hover:scale-[2]  hover:text-(--accent) hover:rotate-180 transition-all"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
              />
            </div>
          </motion.div>

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

          <AnimatePresence>
            {hasInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={springGentle}
                className="flex items-center justify-between overflow-hidden"
              >
                <span className="font-mono text-xs text-(--muted)">
                  {results.length}{" "}
                  {results.length === 1 ? "project" : "projects"}
                  {hasActiveFilters &&
                    ` · ${filters.size} filter${filters.size > 1 ? "s" : ""} active`}
                </span>
                <button
                  type="button"
                  onClick={clearAll}
                  className="font-mono text-xs text-(--muted) transition-colors hover:text-(--accent)"
                >
                  clear all
                </button>
              </motion.div>
            )}
          </AnimatePresence>

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
                    className="py-10 text-center font-mono text-sm text-(--muted)"
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
        className="h-24 animate-pulse rounded-xl border border-(--border) bg-(--surface)"
      />
    ))}
  </div>
);
