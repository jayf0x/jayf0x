# Personal Site — Design & Architecture Spec

> Written for the implementation agent. Everything here is a decision, not a suggestion.
> The goal: a frontend portfolio that reads like a **well-architected codebase** — minimal noise, sharp signal, every choice deliberate.

---

## 1. Identity & Feel

**Persona**: Jonatan operates at the intersection of pixel-perfect UI and low-level systems. He built 3D BIM annotation projectors in the browser, authored a WebGL shader package, and automates his own timesheets. This site should feel like _his tooling_ — precise, dark, fast.

**Aesthetic reference**: Think Vercel dashboard meets a well-maintained terminal config. Not a "dev portfolio template". Not loud. Obsidian dark, single electric accent, tight typography.

**Tone**: No buzzwords. No "passionate developer". Copy reads like documentation — confident, specific, dry.

---

## 2. Visual Design System

### Color Palette

```
--bg:           #060608      /* near-black, not pure — has depth */
--surface:      #0f0f12      /* cards, overlays */
--surface-2:    #1a1a1f      /* elevated surfaces */
--border:       rgba(255,255,255,0.07)
--text:         #e8e8ea      /* primary text */
--muted:        #5a5a6a      /* secondary text */
--accent:       #4f7cff      /* electric blue — single accent color */
--accent-glow:  rgba(79,124,255,0.15)

/* Light mode tokens (all toggled via [data-theme="light"] on <html>) */
--bg-light:     #fafafa
--surface-light: #ffffff
--border-light: rgba(0,0,0,0.08)
--text-light:   #0f0f12
--muted-light:  #6b7280
```

### Typography

```
Font stack:
  - Display/headings: "Geist" (variable, weight 400–900) — clean, technical
  - Body: system-ui stack (OS-native, no extra load)
  - Monospace: "Geist Mono" — for terminal elements, code badges, stats

Scale (Tailwind tokens, not custom):
  hero name:  text-6xl md:text-8xl, font-black, tracking-tighter
  section h:  text-3xl md:text-4xl, font-bold
  body:       text-base (16px), leading-relaxed
  caption:    text-sm, text-muted
  mono small: text-xs font-mono
```

### Spacing

Single-page scroll. No routes needed. Sections breathe — `py-32` minimum. Max content width: `max-w-5xl` centered.

---

## 3. Background: Reactive Dot Grid

**Keep** the dot grid from src-backup. **Upgrade** it:

- Dots rendered as SVG pattern (same as backup — works great)
- Add subtle **mouse parallax**: on `mousemove`, apply a CSS custom property `--mx` / `--my` (0–1 normalized) that shifts the SVG pattern via `patternTransform`. Maximum shift: 8px. Pure CSS + one tiny JS event listener. No library.
- The animated blobs stay but tone down opacity: `opacity-[0.08]` dark, removed entirely in light mode.
- Blob colors: `from-[#4f7cff]` and `from-[#8b5cf6]` — tighter to the accent palette.

```tsx
// Background.tsx gets a ref for mouse tracking:
// window.addEventListener('mousemove', handler, { passive: true })
// Sets: document.documentElement.style.setProperty('--mx', x/W)
// SVG pattern: patternTransform="translate(calc(var(--mx,0)*8) calc(var(--my,0)*8))"
```

---

## 4. Page Sections

### 4.1 HeroSection

**Layout**: Full viewport height, centered vertically.

**Content**:
```
[name — large, heavy, tight]
Jonatan Vons

[rotating descriptor — monospace, accent color]
> builds 3D browser viewers
> ships WebGL shader packages  
> automates workflows with AI
> makes tools that last

[tagline — body, muted]
Frontend engineer in Ghent.
I build interfaces that render fast and hold up.

[CTAs]
[GitHub ↗]  [Email ↗]

[scroll indicator — animated arrow, bottom of section]
```

**Animation sequence** (framer-motion, staggered):
1. Name fades up (delay: 0)
2. Terminal lines type in one by one using `TypeAnimation` (delay: 0.3) — but use REAL copy from about-user.md, not placeholders
3. Tagline fades up (delay: 0.8)
4. CTAs fade up (delay: 1.0)

**The terminal block** (the 11/10 move):
Instead of `TypeAnimation` on random words, make it look like actual terminal output:

```
<span class="muted">~/code</span> <span class="accent">❯</span> cat about.txt
```
...then the descriptor types in. Cursor blink at end using CSS `@keyframes blink`. This references his real work — not generic.

### 4.2 AboutSection

**NOT** a generic "skills" section. Three focused cards that tell a story:

```
Card 1: "3D in the browser"
  Icon: Cube (lucide)
  Copy: "Built real-time projection of 3D annotations into 2D browser space
         at Bricsys — pure React and CSS transforms across a shared monorepo."

Card 2: "The TanStack practitioner"
  Icon: Layers
  Copy: "Daily driver: TanStack Query, Form, and Router. Added form validation
         to the internal Bricsys component library. Opinionated about caching."

Card 3: "Tools that automate themselves"
  Icon: Terminal
  Copy: "Built PIIPAYA for PII anonymization, Pure-Paste for URL hygiene,
         and a headless Git→timesheet pipeline. If it's manual and repetitive, 
         it gets automated."
```

Layout: `grid grid-cols-1 md:grid-cols-3 gap-4`. Cards: `bg-surface border border-border rounded-xl p-6`.

Entrance: `whileInView` fadeUp (viewport once, -80px margin).

### 4.3 ProjectSection

**The main event.** Each project gets a full-width alternating layout (already in backup — keep it).

**Upgrade the cards**:

1. **Live GitHub stats** via TanStack Query:
   - Stars, last pushed date, primary language
   - Displayed as a row of mono badges: `★ 12  ·  TypeScript  ·  2 days ago`
   - Skeleton loading state (pulse animation) while fetching

2. **Preview image strategy**: 
   - Each repo has a `preview` field. Map from `constants/projects.ts`.
   - Fallback: generate a dark placeholder card with the repo name large in mono font (CSS only, no missing image).
   - On hover: image gets `scale(1.02)` with `transition-transform duration-500`

3. **Download badge**: If a `.dmg` asset exists on latest release, show a `↓ macOS` pill badge with accent color. Already fetched in backup, keep that pattern but migrate to TanStack Query.

4. **Project ordering**: Controlled via `constants/projects.ts` — not GitHub's default sort. Pinned list with metadata:

```ts
// constants/projects.ts
export const PINNED_PROJECTS = [
  { name: 'PIIPAYA',        priority: 100, tags: ['Tauri', 'Svelte', 'Python'] },
  { name: 'Pure-Paste',     priority: 90,  tags: ['Swift', 'macOS'] },
  { name: 'fluidity',       priority: 80,  tags: ['React', 'WebGL'] },
  // Timesheet Automation is private — add a static entry
]
```

5. **Static project entry** for "Timesheet Automation" (private repo):
   - `isPrivate: true` flag → renders without GitHub link
   - Same card layout, shows `[private]` badge in muted text

### 4.4 Footer

```
Jonatan Vons  ·  Ghent, BE  ·  <year>
[GitHub]  [Email]
```

One line. No color. `text-muted`. `py-12`.

---

## 5. Navigation

**Floating scroll-spy indicator** — not a traditional nav.

A vertical line on the right edge (fixed, `right-6 top-1/2 -translate-y-1/2`). Four dots on the line, one per section. Active dot: filled accent. Inactive: empty ring. No text labels. On click: smooth scroll to section.

```tsx
// Uses useScrollSpy hook — IntersectionObserver watching each section's id
// sections: ['hero', 'about', 'projects', 'contact']
```

This is the "Special Ops" touch — navigation as a status indicator, not a menu.

---

## 6. Theme

**Dark by default** (keep from backup). Toggle persists to `localStorage`.

**Implementation**: `ThemeContext` with provider in `App.tsx`. Sets `data-theme` attribute on `<html>`. All colors via CSS custom properties scoped to `[data-theme]`.

**Toggle position**: `fixed top-4 right-4` (keep from backup). Add tooltip on hover: "Light / Dark".

---

## 7. Architecture

### File Structure

```
src/
├── app/
│   ├── App.tsx              # Providers + page shell
│   └── providers.tsx        # QueryClientProvider + ThemeProvider stacked
├── components/
│   ├── layout/
│   │   ├── Layout.tsx       # Background + Nav + ThemeToggle + <main>{children}
│   │   ├── Navigation.tsx   # Scroll-spy dot nav (right edge)
│   │   └── Footer.tsx
│   ├── ui/
│   │   ├── Badge.tsx        # Small pill: language, tag, download
│   │   ├── Card.tsx         # Base card shell (surface + border + radius)
│   │   └── Skeleton.tsx     # Pulse placeholder for loading states
│   ├── Background.tsx       # Dot grid + blobs + mouse parallax
│   └── ThemeToggle.tsx
├── sections/
│   ├── HeroSection.tsx
│   ├── AboutSection.tsx
│   ├── ProjectSection.tsx
│   └── ContactSection.tsx   # (footer-adjacent minimal CTA)
├── hooks/
│   ├── useRepositories.ts   # TanStack Query: repos list
│   ├── useLatestRelease.ts  # TanStack Query: .dmg asset per repo
│   ├── useTheme.ts          # Consumes ThemeContext
│   └── useScrollSpy.ts      # IntersectionObserver → active section id
├── lib/
│   ├── github.ts            # Axios instance + typed API functions
│   └── queryClient.ts       # QueryClient: staleTime 5m, gcTime 30m
├── constants/
│   └── projects.ts          # Pinned list, priority, tags, preview paths
├── context/
│   └── ThemeContext.tsx
├── types/
│   ├── github.ts            # GitHub API response types (from backup)
│   └── project.ts           # App-level Project type
├── styles/
│   └── globals.css          # Tailwind + CSS vars + keyframes
├── main.tsx
└── vite-env.d.ts
```

### Data Layer

**`lib/github.ts`** — Axios instance, not raw fetch:
```ts
const github = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    'User-Agent': 'jayf0x-site',
    Accept: 'application/vnd.github+json',
  },
})
// interceptor for optional GITHUB_TOKEN from env
```

**`lib/queryClient.ts`**:
```ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 min — GitHub data doesn't change fast
      gcTime:    1000 * 60 * 30,  // 30 min cache retention
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
```

**`hooks/useRepositories.ts`**:
```ts
export const useRepositories = () =>
  useQuery({
    queryKey: ['repositories', 'jayf0x'],
    queryFn: () => github.get<Repository[]>('/users/jayF0x/repos').then(r => r.data),
    select: (data) => sortByPriority(filterPinned(data)),
  })
```

**`hooks/useLatestRelease.ts`**:
```ts
export const useLatestRelease = (repo: string) =>
  useQuery({
    queryKey: ['release', 'jayf0x', repo],
    queryFn: () => github.get(`/repos/jayF0x/${repo}/releases/latest`).then(r => r.data),
    select: extractDmgUrl,
    staleTime: 1000 * 60 * 60, // releases change even less often
  })
```

---

## 8. Animations Strategy

All motion via `framer-motion`. Zero custom CSS animation for layout/enter animations.

Pattern (reuse from backup, keep it):
```ts
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },         // hero (immediate)
  whileInView: { opacity: 1, y: 0 },     // sections (scroll-triggered)
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.55, delay, ease: 'easeOut' },
})
```

**Don't** add more animation types. Consistency > variety.

CSS-only:
- Dot blink: `@keyframes blink` on terminal cursor
- Blob drift: `@keyframes blob` (already in backup)
- Scroll arrow bounce: `@keyframes bounce` (already in tailwind)

---

## 9. Dependencies

### Add
```
axios                   # HTTP client with interceptors
@tanstack/react-query   # Server state, cache, invalidation
```

### Keep
```
framer-motion           # Animation
react-type-animation    # Terminal typing effect
lucide-react            # Icons
tailwindcss             # Utility CSS
```

### Remove / Replace
- Raw `fetch` in `utils/fetch-repository.ts` → replaced by `lib/github.ts` (Axios)
- Manual `useState` loading/fetch in `useRepositories` → replaced by TanStack Query

---

## 10. TODOs resolved from src-backup

| Location | TODO | Resolution |
|---|---|---|
| `useRepository.tsx:13` | add previews | `constants/projects.ts` preview map |
| `useRepository.tsx:16` | add priority | `constants/projects.ts` priority map |
| `useRepository.tsx:57` | cache results | TanStack Query `staleTime` |
| `useRepository.tsx:62-77` | DUMMY_RESPONSE hack | React Query devtools + `enabled: false` env flag |
| `ProjectSection.tsx:26` | smooth loading | `Skeleton` component while `isLoading` |
| `ThemeToggle.tsx:11` | unreachable `return` | Clean up in `useTheme.ts` |

---

## 11. Accessibility

- All interactive elements: `focus-visible` ring using accent color
- `aria-label` on icon-only buttons (ThemeToggle, nav dots)
- Images: descriptive `alt` (project name + "preview screenshot")
- Color contrast: text/bg pairs meet WCAG AA at minimum
- `prefers-reduced-motion`: wrap framer-motion variants in `useReducedMotion()` check

---

## 12. Performance

- Fonts: load Geist via `@font-face` with `font-display: swap`
- GitHub API: TanStack Query cache means 0 re-fetches on revisit within stale window
- Images: `loading="lazy"` on all project previews
- Background SVG: `pointer-events-none` (already done in backup) + `will-change: transform` on blobs only

---

## 13. Backlog — Ordered Ticket List for Implementation Agent

### Milestone 0: Scaffold
1. `[SETUP-1]` Init new Vite + React + TypeScript project in `src/`
2. `[SETUP-2]` Install and configure Tailwind v4, define CSS custom properties for design tokens
3. `[SETUP-3]` Install `axios`, `@tanstack/react-query`, `framer-motion`, `react-type-animation`, `lucide-react`
4. `[SETUP-4]` Configure `queryClient.ts` with stale/gc times
5. `[SETUP-5]` Set up `providers.tsx` wrapping `QueryClientProvider` + `ThemeProvider`

### Milestone 1: Foundation Components
6. `[COMP-1]` Implement `ThemeContext` + `useTheme` hook. `data-theme` on `<html>`. localStorage persist. Default dark.
7. `[COMP-2]` Implement `ThemeToggle` component (port from backup, consume `useTheme`, fix unreachable return)
8. `[COMP-3]` Implement `Background` component with mouse parallax (SVG dot grid + CSS vars `--mx`/`--my` + blobs)
9. `[COMP-4]` Implement `ui/Badge`, `ui/Card`, `ui/Skeleton` atoms
10. `[COMP-5]` Implement `Layout` component: `Background` + `Navigation` + `ThemeToggle` + `<main>`

### Milestone 2: Data Layer
11. `[DATA-1]` Implement `lib/github.ts`: Axios instance, `VITE_GITHUB_TOKEN` env support, typed API functions
12. `[DATA-2]` Port and clean `fetchRepositories` pagination logic from backup into `lib/github.ts`
13. `[DATA-3]` Implement `useRepositories` hook via TanStack Query (filter + sort using `constants/projects.ts`)
14. `[DATA-4]` Implement `useLatestRelease` hook via TanStack Query (extract `.dmg` URL)
15. `[DATA-5]` Write `constants/projects.ts` with PIIPAYA, Pure-Paste, fluidity, Timesheet Automation entries

### Milestone 3: Navigation
16. `[NAV-1]` Implement `useScrollSpy` hook (IntersectionObserver, returns active section id)
17. `[NAV-2]` Implement `Navigation` component: fixed right-edge dot indicators with scroll-to on click

### Milestone 4: Sections
18. `[SECTION-1]` Implement `HeroSection`: name, terminal typing block, tagline, GitHub + email CTAs, scroll arrow
19. `[SECTION-2]` Implement `AboutSection`: three story cards (3D viewer, TanStack, automation tools)
20. `[SECTION-3]` Implement `ProjectSection`: alternating layout, live GitHub stats badges, skeleton loading, preview images, download badge, static private project entry
21. `[SECTION-4]` Implement `Footer`: single-line name + location + year + links

### Milestone 5: Polish
22. `[POLISH-1]` Audit all animations: stagger timing, reduced-motion guard, viewport triggers
23. `[POLISH-2]` Add `focus-visible` rings across all interactive elements
24. `[POLISH-3]` Add `loading="lazy"` to all images, verify font-display swap
25. `[POLISH-4]` Light mode QA: verify all color tokens, blob visibility, contrast ratios
26. `[POLISH-5]` Add `ReactQueryDevtools` behind `import.meta.env.DEV` guard

---

## 14. What Makes This an 11

1. **Terminal hero block** — references his actual work in the typing sequence. Not "I'm a developer". Reads like a man who lives in his terminal.

2. **Mouse-reactive dot grid** — the dots *follow you*. Subtle, costs nothing, instantly memorable. Ties directly to his fluidity-js / WebGL background.

3. **Right-edge dot nav** — no nav bar. A vertical progress indicator. Signals spatial awareness, precision. Every other portfolio has a `<nav>` with text. This one has a status LED.

4. **Live repo stats** — stars, language, last push rendered in monospace. The page is *connected* to his actual work, not a static snapshot.

5. **Static private project card** — Timesheet Automation gets a card even though the repo is private. Shows depth of work that GitHub can't. The `[private]` badge is a badge of honor, not an apology.

6. **Architecture is the portfolio** — the code structure itself demonstrates his stated skills. TanStack Query for caching, clean hooks, typed API layer, context providers. A hiring engineer reading the source sees a practitioner, not a student.

## 15. Merged Scope Addendum (2026-04-19)

This addendum resolves conflicts between earlier multi-page instructions and the current implementation direction.

### Canonical Direction
- The site is a **single-page application** with smooth scrolling between sections.
- Routing is allowed only as an app shell concern (e.g. root route), not as separate content pages.
- Content that was requested as "pages" is implemented as sections in one flow.

### Required Sections (Merged)
1. `hero` (Home intro)
2. `about`
3. `projects`
4. `resume`
5. `contact` (footer-level CTA)

### Home Requirement Mapping
- Hero section: required
- Short intro: required (type animation can be used sparingly)
- Featured projects preview: required near hero/about before full projects section

### Projects Requirement Mapping
- Full projects list remains in the dedicated `projects` section
- Alternating left/right panel layout required
- Large previews with gradient overlay required
- Each project shows name, description, image, and external link when public
- Private projects are rendered as static entries without public repo links

### Resume Requirement Mapping
- Resume is a dedicated `resume` section in the same page
- Must show preview image from `src/assets/resume.png`
- Use `FluidImage` only when it does not harm performance; fallback to `<img>` is valid
- Persistent download action for `src/assets/resume.pdf` is required

### Data + Performance Constraints
- Data fetching uses `axios`
- Add basic caching in hook or simple in-memory module cache
- Loading and error states are mandatory
- Avoid unnecessary dependencies; prefer existing stack

### Routing Clarification
- `routes.tsx` should exist and provide app routing structure
- Current scope only requires a root route (`/`) rendering the single-page site
- Section navigation uses in-page anchors and scroll-spy, not route changes
