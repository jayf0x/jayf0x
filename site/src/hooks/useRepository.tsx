import { useEffect, useState } from "react"
import { PINNED_PROJECTS, PROJECT_OWNER, projectMetaByRepoName } from "../constants/projects"
import type { Project } from "../types"
import { fetchLatestDmgUrl, fetchRepositories, type Repository as RawRepository } from "../utils/fetch-repository"

export type RepositoryState = {
  repositories: Project[]
  featured: Project[]
  recentlyUpdated: Project[]
  isLoading: boolean
  error: string | null
}

const CACHE_TTL_MS = 5 * 60 * 1000

let cache: { repositories: Project[]; featured: Project[]; recentlyUpdated: Project[] } | null = null
let cacheTimestamp = 0
let inflightRequest: Promise<{ repositories: Project[]; featured: Project[]; recentlyUpdated: Project[] }> | null = null

const timeSince = (isoDate?: string) => {
  if (!isoDate) return "unknown"
  const diff = Date.now() - new Date(isoDate).getTime()

  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}m ago`
  if (diff < day) return `${Math.floor(diff / hour)}h ago`
  return `${Math.floor(diff / day)}d ago`
}

const ogPreview = (repoName: string) =>
  `https://opengraph.githubassets.com/site/jayf0x/${repoName}`

const toProject = async (repo: RawRepository): Promise<Project | null> => {
  const meta = projectMetaByRepoName.get(repo.name.toLowerCase())
  if (!meta) return null

  const downloadUrl = meta.hasReleases ? await fetchLatestDmgUrl(PROJECT_OWNER, repo.name) : null

  return {
    name: meta.name,
    url: repo.html_url,
    description: repo.description ?? "No description provided.",
    preview: meta.screenshotSrc ?? ogPreview(repo.name),
    tags: meta.tags,
    priority: meta.priority,
    language: repo.language,
    stars: repo.stargazers_count,
    pushedAt: timeSince(repo.pushed_at),
    pushedAtIso: repo.pushed_at,
    downloadUrl: downloadUrl || undefined,
    featured: meta.featured,
    spectrumIndex: meta.spectrumIndex,
  }
}

async function buildRepositories() {
  const repos = await fetchRepositories(PROJECT_OWNER, {
    agent: "jayf0x-site",
  })

  const mapped = await Promise.all(repos.map(toProject))
  const publicProjects = mapped
    .filter((project): project is Project => project !== null)
    .sort((a, b) => b.priority - a.priority)

  const privateProjects: Project[] = PINNED_PROJECTS.filter((project) => project.isPrivate).map((project) => ({
    name: project.name,
    description: project.description ?? "Private project",
    preview: project.preview,
    tags: project.tags,
    priority: project.priority,
    isPrivate: true,
    featured: project.featured,
    spectrumIndex: project.spectrumIndex,
  }))

  const repositories = [...publicProjects, ...privateProjects].sort((a, b) => b.priority - a.priority)
  const featured = repositories.filter((project) => project.featured).slice(0, 3)
  const recentlyUpdated = repositories
    .filter((project) => Boolean(project.pushedAtIso))
    .sort((a, b) => new Date(b.pushedAtIso ?? 0).getTime() - new Date(a.pushedAtIso ?? 0).getTime())
    .slice(0, 5)

  return { repositories, featured, recentlyUpdated }
}

async function getRepositoriesWithCache() {
  const now = Date.now()
  if (cache && now - cacheTimestamp < CACHE_TTL_MS) {
    return cache
  }

  if (!inflightRequest) {
    inflightRequest = buildRepositories().then((result) => {
      cache = result
      cacheTimestamp = Date.now()
      inflightRequest = null
      return result
    })
  }

  return inflightRequest
}

export const useRepositories = (): RepositoryState => {
  const [state, setState] = useState<RepositoryState>({
    repositories: cache?.repositories ?? [],
    featured: cache?.featured ?? [],
    recentlyUpdated: cache?.recentlyUpdated ?? [],
    isLoading: !cache,
    error: null,
  })

  useEffect(() => {
    let active = true

    getRepositoriesWithCache()
      .then((result) => {
        if (!active) return
        setState({
          repositories: result.repositories,
          featured: result.featured,
          recentlyUpdated: result.recentlyUpdated,
          isLoading: false,
          error: null,
        })
      })
      .catch((error: unknown) => {
        if (!active) return
        const message = error instanceof Error ? error.message : "Failed to fetch repositories"
        setState((previous) => ({ ...previous, isLoading: false, error: message }))
      })

    return () => {
      active = false
    }
  }, [])

  return state
}
