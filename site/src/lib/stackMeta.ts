export type StackMeta = { color: string; bg: string; label: string };

const meta: Record<string, StackMeta> = {
  swift: { color: "var(--border-a100)", bg: "var(--c-f05138)", label: "Swift" },
  python: { color: "var(--border-a100)", bg: "var(--c-3776ab)", label: "Py" },
  typescript: { color: "var(--border-a100)", bg: "var(--c-3178c6)", label: "TS" },
  javascript: { color: "var(--bg)", bg: "var(--c-f7df1e)", label: "JS" },
  rust: { color: "var(--border-a100)", bg: "var(--c-ce422b)", label: "Rs" },
  go: { color: "var(--border-a100)", bg: "var(--c-00add8)", label: "Go" },
  bash: { color: "var(--border-a100)", bg: "var(--shadow-a100)", label: "Bash" },
  yaml: { color: "var(--border-a100)", bg: "var(--c-6b4c9a)", label: "YAML" },
  react: { color: "var(--bg)", bg: "var(--c-61dafb)", label: "Re" },
  svelte: { color: "var(--border-a100)", bg: "var(--c-ff3e00)", label: "Sv" },
  swiftui: { color: "var(--border-a100)", bg: "var(--c-0071e3)", label: "SUI" },
  tauri: { color: "var(--border-a100)", bg: "var(--c-ffc131)", label: "Tau" },
  webgl: { color: "var(--border-a100)", bg: "var(--c-9b4dca)", label: "GL" },
  automator: { color: "var(--border-a100)", bg: "var(--muted)", label: "Auto" },
  macos: { color: "var(--border-a100)", bg: "var(--surface-2)", label: "macOS" },
  cli: { color: "var(--overlay-a100-3)", bg: "var(--surface-2)", label: "CLI" },
};

const FALLBACK: StackMeta = { color: "var(--overlay-a100)", bg: "transparent", label: "" };

export function getStackMeta(key: string): StackMeta {
  return meta[key.toLowerCase()] ?? { ...FALLBACK, label: key };
}
