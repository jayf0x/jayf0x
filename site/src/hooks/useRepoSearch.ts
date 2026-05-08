import { useMemo } from "react";
import type { GithubRepo } from "@/utils/fetch-repository";

function matches(repo: GithubRepo, q: string): boolean {
  const lower = q.toLowerCase();
  return (
    repo.name.toLowerCase().includes(lower) ||
    (repo.description?.toLowerCase().includes(lower) ?? false) ||
    repo.topics.some((t) => t.toLowerCase().includes(lower)) ||
    (repo.language?.toLowerCase().includes(lower) ?? false)
  );
}

export function useRepoSearch(
  repos: GithubRepo[],
  query: string,
  filters: Set<string>,
) {
  const allStacks = useMemo(
    () =>
      [
        ...new Set(repos.map((r) => r.language).filter(Boolean) as string[]),
      ].sort(),
    [repos],
  );

  const allTopics = useMemo(
    () => [...new Set(repos.flatMap((r) => r.topics))].sort(),
    [repos],
  );

  const results = useMemo(() => {
    const hasQuery = query.trim().length > 0;
    const hasFilters = filters.size > 0;
    if (!hasQuery && !hasFilters) return [];

    return repos.filter((repo) => {
      const queryMatch = hasQuery ? matches(repo, query.trim()) : true;
      const filterMatch = hasFilters
        ? [...filters].some(
            (f) => repo.language === f || repo.topics.includes(f),
          )
        : true;
      return queryMatch && filterMatch;
    });
  }, [repos, query, filters]);

  return { results, allStacks, allTopics };
}
