import { useMemo } from "react"
import entries from "../assets/repositories.json"
import type { RepoEntry } from "../types/repository"

const data = entries as RepoEntry[]

function matches(entry: RepoEntry, q: string): boolean {
  const lower = q.toLowerCase()
  return (
    entry.repo.toLowerCase().includes(lower) ||
    entry.repo_description.toLowerCase().includes(lower) ||
    entry.ollama_description.toLowerCase().includes(lower) ||
    entry.keywords.some((k) => k.toLowerCase().includes(lower)) ||
    entry.stack.some((s) => s.toLowerCase().includes(lower)) ||
    entry.types.some((t) => t.toLowerCase().includes(lower))
  )
}

export function useRepoSearch(query: string, filters: Set<string>) {
  const allStacks = useMemo(
    () => [...new Set(data.flatMap((e) => e.stack))].sort(),
    []
  )
  const allTypes = useMemo(
    () => [...new Set(data.flatMap((e) => e.types))].sort(),
    []
  )

  const results = useMemo(() => {
    const hasQuery = query.trim().length > 0
    const hasFilters = filters.size > 0
    if (!hasQuery && !hasFilters) return []

    return data.filter((entry) => {
      const queryMatch = hasQuery ? matches(entry, query.trim()) : true
      const filterMatch = hasFilters
        ? [...filters].every(
            (f) => entry.stack.includes(f) || entry.types.includes(f)
          )
        : true
      return queryMatch && filterMatch
    })
  }, [query, filters])

  return { results, allStacks, allTypes }
}
