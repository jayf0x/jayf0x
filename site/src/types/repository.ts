/** Shape of each entry in repositories.json */
export type RepoEntry = {
  repo: string
  repo_description: string
  ollama_description: string
  keywords: string[]
  stack: string[]
  types: string[]
}

/** Live GitHub data fetched per result */
export type RepoDetails = {
  name: string
  url: string
  description: string | null
  language: string | null
  stars: number
  pushedAt: string
  downloadUrl?: string
}

/** A search result = entry + live details (may be loading) */
export type SearchResult = {
  entry: RepoEntry
  details?: RepoDetails
}
