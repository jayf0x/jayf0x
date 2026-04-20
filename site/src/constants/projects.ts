import type { ProjectMeta } from "../types/project"

export const PINNED_PROJECTS: ProjectMeta[] = [
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

export const PROJECT_OWNER = "jayF0x"

export const projectMetaByRepoName = new Map(
  PINNED_PROJECTS.filter((project) => project.repoName).map((project) => [
    project.repoName?.toLowerCase() ?? "",
    project,
  ])
)
