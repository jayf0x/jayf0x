# Frontend Stack Visualizer

**Tagline:** *"Just a button?"*

A personal portfolio site that shows a deceptively simple UI (button, form) and reveals the full React/Zustand/React Query machinery underneath it in a live 3D graph. The graph lights up as the user interacts — renders, state updates, query calls — all connected and color-coded.

---

## Stack

React 18 + Vite + TypeScript. Tailwind for layout. Leva for all runtime controls. Zustand for all app state. React Query v5 for server state. Three.js via `@react-three/fiber` + `@react-three/drei` for the 3D scene. `@react-three/postprocessing` for bloom. `d3-hierarchy` for tree layout. `nanoid` for IDs.

Use `bun` not `npm`.

---

## Core Architecture

### Build once, highlight after

The graph is **static**. Nodes are created at registration time (component mount, store init, query key declaration) — not when events fire. Runtime events only change node *state* (idle → active → dimmed). Positions never change after first layout.

### Slabs

Three bounded 3D volumes stacked vertically in world space:

- **Render Tree** (blue `#4f9cf9`) — mirrors the React component hierarchy, Reingold-Tilford tree layout via `d3-hierarchy`
- **Zustand** (purple `#a855f7`) — one cluster per store; store → slices → actions. All nodes visible at mount, idle until called.
- **React Query** (green `#22c55e`) — one linear chain per query key: key → loading → result

Slabs stack from y=0 (UI disc) down to y=-7. Cross-slab connections are thread lines (white, 15% opacity at idle, pulse on cascade).

### Cascade IDs

Every user interaction seeds a `cascadeId` (nanoid). All downstream events inherit it — Zustand middleware reads it, query callbacks close over it. Causality chain is `USER_EVENT → STATE_UPDATE → RENDER → QUERY_START → QUERY_SUCCESS`. The HighlightSystem staggers activation by `cascadeHopDelay` (default 80ms) so the glow visibly travels the chain.

**React Query async:** capture `getCascadeId()` synchronously before the mutation fires, close over it in `onSuccess`/`onError`. No special async machinery needed.

### Node states

`IDLE` (20% emissive) → `ACTIVE` (100% emissive + bloom) → `DIMMED` (lerping back, 800ms) → `IDLE`. `SELECTED` = pinned at 70%, shows tooltip (Phase 5).

### Color language

| Signal | Color |
|---|---|
| User Event | Red `#ff4444` |
| Re-render | Blue `#4f9cf9` |
| Zustand | Purple `#a855f7` |
| React Query | Green `#22c55e` |
| Cross-slab thread | White 15% |

---

## Key Files

```
src/
  components/       GraphScene, SlabVolume, NodeMesh, EdgeLine,
                    ThreadLine, HighlightAnimator, LeftPanel,
                    RightPanel, DemoButton
  instrumentation/  queue.ts (ring buffer + cascadeId ref),
                    useRenderTracker.ts, useEventTracker.ts,
                    zustandLogger.ts
  layout/           slabs.ts (static Slab definitions),
                    slabLayout.ts + per-type strategies
  store/            registryStore.ts (static graph),
                    highlightStore.ts (NodeState map),
                    demoStore.ts
  hooks/            useMockQuery.ts
```

Phase 1 legacy files (`graphStore.ts`, `eventBus.ts`, `3d-force-graph`) are to be removed in Phase 2.

---

## Layout & Visual

- Split screen: left = "The Interface", right = "What's Actually Happening"
- Background `#0a0a0a`. Monospace font. Minimal chrome.
- Camera: `(0, +3, +8)`, angled ~30° down, OrbitControls, auto-rotate until interaction
- Bloom via `<Bloom>` post-processing pass. All tunables in Leva.

---

## Phase Status

- **Phase 1 ✓** — ForceGraph3D POC. Static nodes spawn on click, force layout. Known issue: restarts simulation per event. Intentionally replaced.
- **Phase 2** — Migration to R3F static scene + three signal types. See action plan.
- **Phase 3** — Stabilisation, perf audit, `ARCHITECTURE.md`
- **Phase 4** — UI panel: tab switcher with Button / LoginForm / SearchInput / Toggle
- **Phase 5** — Polish: bloom tuning, traveling dots, custom cursor, entry animation

---

## Open Questions (unresolved)

| # | Question |
|---|---|
| 2 | Should slab height scale with node count? (decide Phase 3) |
| 4 | Should `useRenderTracker` filter StrictMode double-renders? |
| 5 | Is `d3-hierarchy` fast enough for real-time re-layout? (profile Phase 3) |
| 7 | Physics toggle for exploratory mode? (backlog) |
| 8 | Thread lines: node-to-node vs slab-boundary? (current plan: node-to-node) |
