# Backlog

## Project row expand/collapse
- Click row → animate open below it (AnimatePresence + height, duration 0.15, ease easeOut)
- Show full-bleed screenshot (`project.preview`) edge-to-edge within grid
- One image, no border-radius, no overlay
- Wrap with `prefers-reduced-motion` guard

## Light mode
- Vars per DESIGN.md: `--bg: #f7f7f5`, `--surface: #efefed`, `--line: rgba(0,0,0,0.07)`, `--sub: #888`, `--text: #111`
- Spectrum colors stay identical on both modes
- Add toggle (minimal, no ThemeToggle component — single `<button>` in hero or footer)
- Persist via `localStorage`

## About text
- Replace placeholder prose with real copy

## Resume / CV
- Confirm `/resume.pdf` exists in `public/` or update href

## Remove unused deps
- `react-type-animation` — no longer used, uninstall
- `framer-motion` — only keep if expand/collapse is implemented, else uninstall

## Tailwind config cleanup
- Strip old token plugin (blob/blink/typing animations, old color vars no longer referenced)

## Responsive refinement
- Project table at <768px shows dot + name only — already done via `hidden md:grid`
- Verify hero icon links don't overflow on very small screens
- Verify fluidity banner height on mobile (280px may be too tall)

## Skeleton component
- Update `Skeleton` to use `--surface` instead of `--surface-2` (token removed)
