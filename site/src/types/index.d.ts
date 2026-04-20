export interface ProjectMeta {
  name: string
  repoName?: string
  priority: number
  tags: string[]
  featured: boolean
  screenshotSrc?: string
  hasReleases?: boolean
  isPrivate?: boolean
  description?: string
  preview?: string
  spectrumIndex: number
}

export interface Project {
  name: string
  url?: string
  description: string
  preview?: string
  tags: string[]
  priority: number
  language?: string | null
  stars?: number
  pushedAt?: string
  pushedAtIso?: string
  downloadUrl?: string
  featured: boolean
  isPrivate?: boolean
  spectrumIndex: number
}
