import { useEffect, useState } from "react"
import type { Project } from "../types/project"
import { fetchLatestDmgUrl, fetchRepositories, type Repository as RawRepository } from "../utils/fetch-repository"


import type { ProjectMeta } from "../types/project"

const PINNED_PROJECTS: ProjectMeta[] = [
  {
    name: "PIIPAYA",
    repoName: "PIIPAYA",
    priority: 100,
    tags: ["Tauri", "Svelte", "Python"],
    featured: true,
    preview: "https://opengraph.githubassets.com/site/jayf0x/PIIPAYA",
  },
  {
    name: "Pure-Paste",
    repoName: "Pure-Paste",
    priority: 90,
    tags: ["Swift", "macOS"],
    featured: true,
    preview: "https://opengraph.githubassets.com/site/jayf0x/Pure-Paste",
  },
  {
    name: "fluidity",
    repoName: "fluidity",
    priority: 80,
    tags: ["React", "WebGL"],
    featured: true,
    preview: "https://opengraph.githubassets.com/site/jayf0x/fluidity",
  },
  {
    name: "Timesheet Automation",
    priority: 70,
    tags: ["CLI", "Automation"],
    isPrivate: true,
    featured: false,
    description:
      "Headless background process and CLI that pulls Git commits and PR data to auto-fill R&D entries into internal timesheets.",
  },
]

const PROJECT_OWNER = "jayF0x"

const projectMetaByRepoName = new Map(
  PINNED_PROJECTS.filter((project) => project.repoName).map((project) => [
    project.repoName?.toLowerCase() ?? "",
    project,
  ])
)



type RepositoryState = {
  repositories: Project[]
  featured: Project[]
  isLoading: boolean
  error: string | null
}

const CACHE_TTL_MS = 5 * 60 * 1000

let cache: { repositories: Project[]; featured: Project[] } | null = null
let cacheTimestamp = 0
let inflightRequest: Promise<{ repositories: Project[]; featured: Project[] }> | null = null

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

const toProject = async (repo: RawRepository): Promise<Project | null> => {
  const meta = projectMetaByRepoName.get(repo.name.toLowerCase())
  if (!meta) return null

  const downloadUrl = await fetchLatestDmgUrl(PROJECT_OWNER, repo.name)

  return {
    name: meta.name,
    url: repo.html_url,
    description: repo.description ?? "No description provided.",
    preview: meta.preview,
    tags: meta.tags,
    priority: meta.priority,
    language: repo.language,
    stars: repo.stargazers_count,
    pushedAt: timeSince(repo.pushed_at),
    downloadUrl: downloadUrl || undefined,
    featured: meta.featured,
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

  const privateProjects = PINNED_PROJECTS.filter((project) => project.isPrivate).map((project) => ({
    name: project.name,
    description: project.description ?? "Private project",
    preview: project.preview,
    tags: project.tags,
    priority: project.priority,
    isPrivate: true,
    featured: project.featured,
  }))

  const repositories = [...publicProjects, ...privateProjects].sort((a, b) => b.priority - a.priority)
  const featured = repositories.filter((project) => project.featured).slice(0, 3)

  return { repositories, featured }
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
