import type { ProjectMeta } from "../types"

export const PINNED_PROJECTS: ProjectMeta[] = [
  {
    name: "PIIPAYA",
    repoName: "PIIPAYA",
    priority: 100,
    tags: ["Tauri", "Svelte", "Python"],
    featured: true,
    hasReleases: true,
    spectrumIndex: 0,
  },
  {
    name: "Pure-Paste",
    repoName: "Pure-Paste",
    priority: 90,
    tags: ["Swift", "macOS"],
    featured: true,
    hasReleases: true,
    spectrumIndex: 1,
  },
  {
    name: "fluidity",
    repoName: "fluidity",
    priority: 80,
    tags: ["React", "WebGL"],
    featured: true,
    hasReleases: false,
    spectrumIndex: 2,
  },
  {
    name: "Timesheet Automation",
    priority: 70,
    tags: ["Node", "CLI", "Automation"],
    isPrivate: true,
    featured: false,
    hasReleases: false,
    description:
      "Headless background process and CLI that pulls Git commits and PR data to auto-fill R&D entries into internal timesheets.",
    spectrumIndex: 3,
  },
]

export const PROJECT_OWNER = "jayF0x"

export const projectMetaByRepoName = new Map(
  PINNED_PROJECTS.filter((project) => project.repoName).map((project) => [
    project.repoName?.toLowerCase() ?? "",
    project,
  ])
)
