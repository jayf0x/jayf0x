import { useQuery, UseQueryResult } from "@tanstack/react-query";
import {
  Archive,
  Scale,
  Github,
  Package,
  Download,
  GlobeIcon,
} from "lucide-react";
import { PropsWithChildren } from "react";
import { withLocalStorageCache } from "@/lib/queryClient";
import { getStackMeta } from "@/lib/stackMeta";
import {
  GithubRepo,
  fetchRepoLanguages,
  fetchPreviewUrl,
  fetchNpmUrl,
  fetchLatestDmgUrl,
} from "@/utils/fetch-repository";
import { CACHE_INVALIDATION_TIME, OWNER } from "@/config";

const queryOpts = {
  staleTime: CACHE_INVALIDATION_TIME,
  gcTime: CACHE_INVALIDATION_TIME,
};

export const RepoCard = ({ repo }: { repo: GithubRepo }) => {
  return (
    <div className="group flex items-start justify-between gap-4 rounded-xl border border-(--border) bg-(--surface) p-4 transition-all duration-150 hover:border-(--accent)">
      <RepoInfo repo={repo} />
      <RepoLinks repo={repo} />
    </div>
  );
};

const RepoInfo = ({ repo }: { repo: GithubRepo }) => {
  const { data: languages = [] } = useQuery<string[]>({
    queryKey: ["repo-langs", repo.name],
    queryFn: () =>
      withLocalStorageCache(
        `gh:langs:${repo.name}`,
        CACHE_INVALIDATION_TIME,
        () => fetchRepoLanguages(repo.languages_url),
      ),
    ...queryOpts,
  });

  return (
    <div className="min-w-0 flex-1 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-(--text)">
          {repo.name}
        </h3>
        {repo.archived && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0 font-mono text-[10px] text-amber-400">
            <Archive size={9} />
            archived
          </span>
        )}
        {repo.stargazers_count > 0 && (
          <span className="font-mono text-xs text-(--muted)">
            ★ {repo.stargazers_count}
          </span>
        )}
        {repo.pushed_at && (
          <span className="font-mono text-xs text-(--muted)">
            · {timeSince(repo.pushed_at)}
          </span>
        )}
      </div>

      {repo.description && (
        <p className="text-sm leading-snug text-(--muted)">
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
            className="rounded-full border border-(--border) px-2 py-0 font-mono text-[10px] text-(--muted)"
          >
            {t}
          </span>
        ))}
      </div>

      {repo.license && (
        <div className="flex items-center gap-1 text-(--muted)">
          <Scale size={10} />
          <span className="font-mono text-[10px]">{repo.license.spdx_id}</span>
        </div>
      )}
    </div>
  );
};

const iconButtonCls =
  "rounded-full border border-(--accent)/40 p-1.5 text-(--accent) transition-colors hover:border-(--accent) hover:bg-(--accent-glow) flex center";

const RepoLinks = ({ repo }: { repo: GithubRepo }) => {
  const { data: previewUrl, isLoading: previewLoading } = useQuery<
    string | null
  >({
    queryKey: ["repo-preview", repo.name],
    queryFn: () =>
      withLocalStorageCache(
        `gh:preview:${repo.name}`,
        CACHE_INVALIDATION_TIME,
        () => fetchPreviewUrl(OWNER, repo.name),
      ),
    ...queryOpts,
  });

  const queryNPM = useQuery<string | null>({
    queryKey: ["repo-npm", repo.name],
    queryFn: () =>
      withLocalStorageCache(
        `npm:${OWNER}:${repo.name}`,
        CACHE_INVALIDATION_TIME,
        () => fetchNpmUrl(OWNER, repo.name),
      ),
    ...queryOpts,
  });

  const queryDMG = useQuery<string | null>({
    queryKey: ["repo-dmg", repo.name],
    queryFn: () =>
      withLocalStorageCache(
        `gh:dmg:${repo.name}`,
        CACHE_INVALIDATION_TIME,
        () => fetchLatestDmgUrl(OWNER, repo.name),
      ),
    ...queryOpts,
  });

  return (
    <div className="flex flex-col">
      <div className="flex flex-row justify-end gap-1.5 pt-0.5 items-center">
        <a
          href={repo.html_url}
          target="_blank"
          rel="noreferrer"
          title="Repository"
          className={iconButtonCls}
        >
          <Github size={13} />
        </a>
        {repo.homepage && (
          <a
            href={repo.homepage}
            target="_blank"
            rel="noreferrer"
            title="Website"
            className={iconButtonCls}
          >
            <GlobeIcon size={15} />
          </a>
        )}

        <LinkIcon query={queryNPM} title="npm package">
          <Package size={15} />
        </LinkIcon>

        <LinkIcon query={queryDMG} title="Download macOS app">
          <Download size={15} />
        </LinkIcon>
      </div>

      {/* preview image */}
      {previewLoading ? (
        <div className="mt-1 h-14 w-24 animate-pulse rounded-lg bg-(--border)" />
      ) : previewUrl ? (
        <div
          className="w-[250px] h-[150px] transition-opacity group-hover:opacity-100 opacity-8 rounded-md"
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
  title,
  children,
}: PropsWithChildren<{
  query: UseQueryResult<string | null, Error>;
  title: string;
}>) => {
  const { data, isLoading } = query;
  if (isLoading)
    return (
      <div className="h-[30px] w-[30px] animate-pulse rounded-full bg-(--border)" />
    );
  if (!data) return null;

  return (
    <a
      href={data}
      target="_blank"
      rel="noreferrer"
      title={title}
      className={iconButtonCls}
    >
      {children}
    </a>
  );
};

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

const timeSince = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = 60_000,
    h = 60 * m,
    d = 24 * h;
  if (diff < h) return `${Math.max(1, Math.floor(diff / m))}m ago`;
  if (diff < d) return `${Math.floor(diff / h)}h ago`;
  return `${Math.floor(diff / d)}d ago`;
};
