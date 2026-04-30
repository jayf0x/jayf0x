import axios from "axios"

export interface Options {
  agent?: string
  token?: string
  kind?: "users" | "orgs"
  fetchUserOrgs?: boolean
}

export interface Repository {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  stargazers_count: number
  language: string | null
  pushed_at: string
}

interface ReleaseAsset {
  name: string
  browser_download_url: string
}

interface Release {
  assets?: ReleaseAsset[]
}

const GITHUB_API = "https://api.github.com"

function buildHeaders(agent: string, token?: string) {
  const headers: Record<string, string> = {
    "User-Agent": agent,
    Accept: "application/vnd.github+json",
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

function parseNextLink(linkHeader?: string): string | null {
  if (!linkHeader) return null

  const parts = linkHeader.split(",")
  for (const part of parts) {
    const section = part.split(";")
    if (section.length < 2) continue

    const url = section[0].trim().replace(/^<|>$/g, "")
    const rel = section[1].trim()
    if (rel === 'rel="next"') return url
  }

  return null
}

async function fetchAllPages<T>(url: string, headers: Record<string, string>): Promise<T[]> {
  const results: T[] = []
  let nextUrl: string | null = url

  while (nextUrl) {
    const response = await axios.get<T[]>(nextUrl, { headers })
    results.push(...response.data)

    const linkHeader =
      (response.headers.link as string | undefined) ??
      (response.headers.Link as string | undefined)

    nextUrl = parseNextLink(linkHeader)
  }

  return results
}

export async function fetchRepositories(user: string, options: Options = {}): Promise<Repository[]> {
  if (!user) {
    throw new TypeError("user must be a non-empty string")
  }

  const {
    agent = "fetch-github-repos-ts",
    token = import.meta.env.VITE_GITHUB_TOKEN,
    kind = "users",
    fetchUserOrgs = false,
  } = options

  const headers = buildHeaders(agent, token)
  const baseUrl = `${GITHUB_API}/${kind}/${encodeURIComponent(user)}/repos?per_page=100`
  const repos = await fetchAllPages<Repository>(baseUrl, headers)

  if (kind === "users" && fetchUserOrgs) {
    const orgsUrl = `${GITHUB_API}/users/${encodeURIComponent(user)}/orgs?per_page=100`
    const orgs = await fetchAllPages<{ login: string }>(orgsUrl, headers)

    const orgRepos = await Promise.all(
      orgs.map((org) =>
        fetchAllPages<Repository>(
          `${GITHUB_API}/orgs/${encodeURIComponent(org.login)}/repos?per_page=100`,
          headers
        )
      )
    )

    for (const list of orgRepos) {
      repos.push(...list)
    }
  }

  return repos
}

export async function fetchRepoDetails(owner: string, repo: string): Promise<{
  name: string
  url: string
  description: string | null
  language: string | null
  stars: number
  pushedAt: string
}> {
  const token = import.meta.env.VITE_GITHUB_TOKEN as string | undefined
  const headers = buildHeaders("jayf0x-site", token)
  const response = await axios.get<Repository>(
    `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    { headers }
  )
  const r = response.data
  return {
    name: r.name,
    url: r.html_url,
    description: r.description,
    language: r.language,
    stars: r.stargazers_count,
    pushedAt: r.pushed_at,
  }
}

export async function fetchLatestDmgUrl(owner: string, repo: string): Promise<string> {
  try {
    const token = import.meta.env.VITE_GITHUB_TOKEN as string | undefined
    const response = await axios.get<Release>(`${GITHUB_API}/repos/${owner}/${repo}/releases/latest`, {
      headers: buildHeaders("jayf0x-site", token),
    })

    const dmg = response.data.assets?.find((asset) => asset.name.endsWith(".dmg"))
    return dmg?.browser_download_url ?? ""
  } catch {
    return ""
  }
}
