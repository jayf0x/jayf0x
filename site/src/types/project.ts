export type ProjectMeta = {
  name: string
  repoName?: string
  priority: number
  tags: string[]
  preview?: string
  featured?: boolean
  isPrivate?: boolean
  url?: string
  description?: string
}

export type Project = {
  name: string
  url?: string
  description: string
  preview?: string
  tags: string[]
  priority: number
  isPrivate?: boolean
  language?: string | null
  stars?: number
  pushedAt?: string
  downloadUrl?: string
  featured?: boolean
}
