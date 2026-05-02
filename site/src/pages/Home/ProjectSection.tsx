import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Github,
  Download,
  X,
  Archive,
  ExternalLink,
  Scale,
  Package,
} from "lucide-react";
import {
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { useRepoSearch } from "../../hooks/useRepoSearch";
import { withLocalStorageCache } from "../../lib/queryClient";
import {
  fetchUserRepos,
  fetchRepoLanguages,
  fetchPreviewUrl,
  fetchNpmUrl,
  fetchLatestDmgUrl,
  type GithubRepo,
} from "../../utils/fetch-repository";
import { getStackMeta } from "../../lib/stackMeta";

const OWNER = "jayf0x";
const TWO_HOURS = 2 * 60 * 60 * 1000;

// ── spring presets ────────────────────────────────────────────────────────────

const spring = { type: "spring" as const, stiffness: 500, damping: 40 };
const springGentle = { type: "spring" as const, stiffness: 320, damping: 32 };

// ── stack badge ───────────────────────────────────────────────────────────────

const StackBadge = ({
  name,
  size = "sm",
}: {
  name: string;
  size?: "sm" | "xs";
}) => {
  const m = getStackMeta(name);
  const px = size === "xs" ? "px-1.5 py-0" : "px-2 py-0.5";
  const text = size === "xs" ? "text-[10px]" : "text-xs";
  return (
    <span
      className={`inline-block shrink-0 rounded font-mono font-medium ${px} ${text}`}
      style={{
        background: m.bg === "transparent" ? "rgba(255,255,255,0.06)" : m.bg,
        color: m.color,
      }}
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
  <div className="flex flex-col gap-1">
    <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
      {label}
    </span>
    <div className="flex gap-1.5 overflow-x-scroll pb-1">
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

// ── helpers ───────────────────────────────────────────────────────────────────

const timeSince = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = 60_000,
    h = 60 * m,
    d = 24 * h;
  if (diff < h) return `${Math.max(1, Math.floor(diff / m))}m ago`;
  if (diff < d) return `${Math.floor(diff / h)}h ago`;
  return `${Math.floor(diff / d)}d ago`;
};

const queryOpts = { staleTime: TWO_HOURS, gcTime: TWO_HOURS };

// ── card ──────────────────────────────────────────────────────────────────────

const RepoCard = ({ repo }: { repo: GithubRepo }) => {
  const { data: languages = [] } = useQuery<string[]>({
    queryKey: ["repo-langs", repo.name],
    queryFn: () =>
      withLocalStorageCache(`gh:langs:${repo.name}`, TWO_HOURS, () =>
        fetchRepoLanguages(repo.languages_url),
      ),
    ...queryOpts,
  });

  return (
    <div className="group flex items-start justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors duration-150 hover:border-[var(--accent)]">
      {/* ── left: content ── */}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--text)]">
            {repo.name}
          </h3>
          {repo.archived && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0 font-mono text-[10px] text-amber-400">
              <Archive size={9} />
              archived
            </span>
          )}
          {repo.stargazers_count > 0 && (
            <span className="font-mono text-xs text-[var(--muted)]">
              ★ {repo.stargazers_count}
            </span>
          )}
          {repo.pushed_at && (
            <span className="font-mono text-xs text-[var(--muted)]">
              · {timeSince(repo.pushed_at)}
            </span>
          )}
        </div>

        {repo.description && (
          <p className="text-sm leading-snug text-[var(--muted)]">
            {repo.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {languages.map((lang) => (
            <StackBadge key={lang} name={lang} size="xs" />
          ))}
          {repo.topics.map((t) => (
            <span
              key={t}
              className="rounded-full border border-[var(--border)] px-2 py-0 font-mono text-[10px] text-[var(--muted)]"
            >
              {t}
            </span>
          ))}
        </div>

        {repo.license && (
          <div className="flex items-center gap-1 text-[var(--muted)]">
            <Scale size={10} />
            <span className="font-mono text-[10px]">
              {repo.license.spdx_id}
            </span>
          </div>
        )}
      </div>

      {/* ── right: links + preview ── */}
      <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
        <ContentLeft repo={repo} />
      </div>
    </div>
  );
};

// ── loading skeleton ──────────────────────────────────────────────────────────

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

// ── section ───────────────────────────────────────────────────────────────────

export const ProjectSection = () => {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: repos = [], isLoading } = useQuery<GithubRepo[]>({
    queryKey: ["repos", OWNER],
    queryFn: () =>
      withLocalStorageCache(`gh:repos:${OWNER}`, TWO_HOURS, () =>
        fetchUserRepos(OWNER),
      ),
    staleTime: TWO_HOURS,
    gcTime: TWO_HOURS,
  });

  // Prefetch all per-repo data once repos are loaded
  useEffect(() => {
    if (repos.length === 0) return;
    const opts = { staleTime: TWO_HOURS };
    repos.forEach((repo) => {
      queryClient.prefetchQuery({
        queryKey: ["repo-langs", repo.name],
        queryFn: () =>
          withLocalStorageCache(`gh:langs:${repo.name}`, TWO_HOURS, () =>
            fetchRepoLanguages(repo.languages_url),
          ),
        ...opts,
      });
      queryClient.prefetchQuery({
        queryKey: ["repo-preview", repo.name],
        queryFn: () =>
          withLocalStorageCache(`gh:preview:${repo.name}`, TWO_HOURS, () =>
            fetchPreviewUrl(OWNER, repo.name),
          ),
        ...opts,
      });
      queryClient.prefetchQuery({
        queryKey: ["repo-npm", repo.name],
        queryFn: () =>
          withLocalStorageCache(`npm:${repo.name}`, TWO_HOURS, () =>
            fetchNpmUrl(repo.name),
          ),
        ...opts,
      });
      queryClient.prefetchQuery({
        queryKey: ["repo-dmg", repo.name],
        queryFn: () =>
          withLocalStorageCache(`gh:dmg:${repo.name}`, TWO_HOURS, () =>
            fetchLatestDmgUrl(OWNER, repo.name),
          ),
        ...opts,
      });
    });
  }, [repos, queryClient]);

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
      <div className="mx-auto w-full max-w-3xl flex flex-col min-h-0 gap-4">
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
              <ChipRow
                label="Stack"
                items={allStacks}
                filters={filters}
                onToggle={toggleFilter}
              />
            )}
            {allTopics.length > 0 && (
              <ChipRow
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
    </section>
  );
};

const iconButtonCls =
  "rounded-full border border-[var(--border)] p-1.5 text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text)]";

const ContentLeft = ({ repo }: { repo: GithubRepo }) => {
  const { data: previewUrl, isLoading: previewLoading } = useQuery<
    string | null
  >({
    queryKey: ["repo-preview", repo.name],
    queryFn: () =>
      withLocalStorageCache(`gh:preview:${repo.name}`, TWO_HOURS, () =>
        fetchPreviewUrl(OWNER, repo.name),
      ),
    ...queryOpts,
  });

  const queryNPM = useQuery<string | null>({
    queryKey: ["repo-npm", repo.name],
    queryFn: () =>
      withLocalStorageCache(`npm:${repo.name}`, TWO_HOURS, () =>
        fetchNpmUrl(repo.name),
      ),
    ...queryOpts,
  });

  const queryDMG = useQuery<string | null>({
    queryKey: ["repo-dmg", repo.name],
    queryFn: () =>
      withLocalStorageCache(`gh:dmg:${repo.name}`, TWO_HOURS, () =>
        fetchLatestDmgUrl(OWNER, repo.name),
      ),
    ...queryOpts,
  });

  return (
    <div>
      <div className="flex flex-row justify-end gap-1.5 pt-0.5">
        <a
          href={repo.html_url}
          target="_blank"
          rel="noreferrer"
          className={iconButtonCls}
        >
          <Github size={13} />
        </a>
        {repo.homepage && (
          <a
            href={repo.homepage}
            target="_blank"
            rel="noreferrer"
            className={iconButtonCls}
          >
            <ExternalLink size={13} />
          </a>
        )}

        <LinkIcon query={queryNPM}>
          <Package size={13} />
        </LinkIcon>

        <LinkIcon query={queryDMG}>
          <Download size={10} /> macOS
        </LinkIcon>
      </div>

      {/* preview image */}
      {previewLoading ? (
        <div className="mt-1 h-14 w-24 animate-pulse rounded-lg bg-[var(--border)]" />
      ) : previewUrl ? (
        <div
          className="w-[250px] h-[150px] transition-opacity group-hover:opacity-100 opacity-8"
          style={{
            background: `url(${previewUrl}) no-repeat`,
            backgroundSize: "140% auto",
            backgroundPosition: "top left",
          }}
        />
      ) : null}
    </div>
  );
};

const LinkIcon = ({
  query,
  children,
}: PropsWithChildren<{ query: UseQueryResult<string | null, Error> }>) => {
  const { data, isLoading } = query;
  if (isLoading)
    return (
      <div className="h-[30px] w-[30px] animate-pulse rounded-full bg-[var(--border)]" />
    );
  if (!data) return null;

  return (
    <a href={data} target="_blank" rel="noreferrer" className={iconButtonCls}>
      {children}
    </a>
  );
};
