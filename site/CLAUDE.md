# Frontend Stack Visualizer

A personal portfolio site. The user lands on what looks like a normal flat webpage — a resume, a form — projected onto a 3D slab. When they rotate the camera, the projection stretches and falls apart, revealing the full frontend engine: component trees, state stores, query chains — all rendered as a live 3D graph that lights up as they interact.

Source of truth: `backup/phase2.md`. That document overrides everything else.

---

## Stack

React 19 + React Compiler + Vite + TypeScript. Tailwind for layout. Leva for all runtime controls (dev only). Zustand for all app state. React Query v5 for server state. Three.js via `@react-three/fiber` + `@react-three/drei` for the 3D scene. `d3-hierarchy` for tree layout. `nanoid` for IDs. No StrictMode.

Use `bun` not `npm`.

---

## Two Tracks

### Track A — The Illusion + Reveal
Entry experience. Camera starts front-facing a projected HTML slab. Rotating reveals the engine behind it. Uses `src/html2canvas/` for the projection technique.

### Track B — Engine Density + Complexity
The engine itself. Dense, entangled, feels like a real system. 30–50+ nodes. Cross-slab threads. Polling node. File ghost layer. Auth flow cascade.

Both tracks share one Three.js renderer and scene.

---

## Core Architecture

### Graph is static
Nodes are created at registration time (component mount, store init, query key declaration). Runtime events only change node *state* (idle → active → dimmed). Positions never change after first layout.

### Engine slabs (Track B)
Three bounded 3D volumes — not stacked symmetrically, offset in X/Z to feel like a real structure:

- **Render Tree** (blue `#4f9cf9`) — React component hierarchy, d3-hierarchy tidy tree layout. Nodes have Z variation proportional to depth.
- **Zustand** (purple `#a855f7`) — store → slices → actions cluster. Slightly to the side and behind render tree.
- **React Query** (green `#22c55e`) — linear chain per query key. Further below and centered.

Slab boundaries are implicit — borders softened or removed, node clustering communicates the region. Cross-slab connections are thread lines (white, 15% opacity at idle, brighten on cascade).

### html2canvas projection (Track A)
`src/html2canvas/` contains the projection pipeline:
- `html-to-canvas.js` — rasterizes an HTMLElement to a THREE.CanvasTexture via SVG foreignObject
- `projected-material.js` — shader projector: texture applied as if from a virtual camera, `uLitness` 0→1 blends flat illusion to full PBR
- `collect-css.js` — embeds Tailwind + fonts into the SVG so styles render correctly
- `scene.example.js` — reference implementation (Track A entry point)
- `utils-scene.js` — `placeOnFloor` utility (not used in R3F slab layout; retained for reference)

### Camera (Track A)
- Default: directly in front of the slab, slight elevation, looking at origin
- Interaction: orbit on mouse drag / touch swipe / device gyro
- **No auto-rotate on load** — user must actively rotate to discover the reveal
- Engine nodes visible at low opacity before rotation, fully visible as camera moves

### Left panel
HTML overlay, not projected. The Three.js canvas is full-screen behind it. On mobile: panel collapses, gyro drives camera.

### Cascade IDs
Every user interaction seeds a `cascadeId` (nanoid). All downstream events inherit it. Causality chain: `USER_EVENT → STATE_UPDATE → RENDER → QUERY_START → QUERY_SUCCESS`. HighlightSystem staggers activation by `cascadeHopDelay` (default 80ms).

**Async:** capture `getCascadeId()` synchronously at the interaction boundary, close over it in async callbacks.

### Node states
`IDLE` (20% emissive) → `ACTIVE` (100% emissive + bloom) → `DIMMED` (lerping back, 800ms) → `IDLE`. `SELECTED` = pinned at 70%, shows tooltip (Stage 3).

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
                    ThreadLine, LeftPanel, RightPanel,
                    tabs/ (TabButton, TabLoginForm, TabSearch, TabToggle)
  html2canvas/      html-to-canvas.js, projected-material.js,
                    collect-css.js, scene.example.js, utils-scene.js
  instrumentation/  queue.ts (ring buffer + cascadeId ref),
                    useRenderTracker.ts, useEventTracker.ts,
                    zustandLogger.ts
  layout/           slabs.ts, slabLayout.ts, renderTreeLayout.ts,
                    zustandLayout.ts, reactQueryLayout.ts
  store/            registryStore.ts (static graph),
                    highlightStore.ts (NodeState map),
                    authStore.ts, demoStore.ts, formStore.ts,
                    searchStore.ts, toggleStore.ts
  hooks/            useMockQuery.ts, useFormQueries.ts, useTabQueries.ts
```

---

## What not to build

- No force simulation. Static layout only.
- No matrix green rain or scanline overlays.
- No auto-rotate on load (Track A).
- No over-instrumentation — signal-to-noise ratio matters.
- All tunable parameters in Leva during dev; hardcoded to final values in prod.

---

## Open Questions

| # | Question |
|---|---|
| 1 | Should slab height scale with node count? |
| 2 | Thread lines: node-to-node vs slab-boundary? (current plan: node-to-node) |
| 3 | Physics toggle for exploratory mode? (backlog) |
