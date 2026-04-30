/** Brand color + short label for known stack entries.
 *  Unlisted stacks fall back to a neutral style. */
export type StackMeta = { color: string; bg: string; label: string }

const meta: Record<string, StackMeta> = {
  // languages
  swift:      { color: "#fff",    bg: "#F05138", label: "Swift"  },
  python:     { color: "#fff",    bg: "#3776AB", label: "Py"     },
  typescript: { color: "#fff",    bg: "#3178C6", label: "TS"     },
  javascript: { color: "#000",    bg: "#F7DF1E", label: "JS"     },
  rust:       { color: "#fff",    bg: "#CE422B", label: "Rs"     },
  go:         { color: "#fff",    bg: "#00ADD8", label: "Go"     },
  bash:       { color: "#fff",    bg: "#3e4144", label: "Bash"   },
  yaml:       { color: "#fff",    bg: "#6b4c9a", label: "YAML"   },
  // frameworks / runtimes
  react:      { color: "#000",    bg: "#61DAFB", label: "Re"     },
  svelte:     { color: "#fff",    bg: "#FF3E00", label: "Sv"     },
  swiftui:    { color: "#fff",    bg: "#0071E3", label: "SUI"    },
  tauri:      { color: "#fff",    bg: "#FFC131", label: "Tau"    },
  webgl:      { color: "#fff",    bg: "#9B4DCA", label: "GL"     },
  // tools / misc
  automator:  { color: "#fff",    bg: "#555",    label: "Auto"   },
  macos:      { color: "#fff",    bg: "#1d1d1f", label: "macOS"  },
  cli:        { color: "#d4d4d4", bg: "#1e1e1e", label: "CLI"    },
}

const FALLBACK: StackMeta = { color: "#a0a0b0", bg: "transparent", label: "" }

export function getStackMeta(key: string): StackMeta {
  return meta[key.toLowerCase()] ?? { ...FALLBACK, label: key }
}
