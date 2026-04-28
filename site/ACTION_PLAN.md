# Action Plan

Each item is one focused agent session. Read the referenced CLAUDE.md section before starting.

---

## Session A — Infrastructure (CLAUDE.md: Core Architecture, Key Files)

Replace Phase 1 internals with the Phase 2 architecture.

- Install `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `d3-hierarchy`, `nanoid`. Remove `3d-force-graph`.
- Build `InstrumentationQueue` (ring buffer, cascadeId ref, emit/subscribe)
- Build `RegistryStore` (idempotent registerNode, debounced layout trigger)
- Build `HighlightStore` (NodeState map, driven by queue subscription)
- Gut `graphStore.ts` and `eventBus.ts` — they are replaced by the above

No rendering yet. Verify with unit-style console tests.

---

## Session B — Layout Engine (CLAUDE.md: Slabs, Key Files → layout/)

Pure layout math, no React.

- Define slab volumes in `slabs.ts` (centers, dimensions, colors)
- Render Tree layout: `d3-hierarchy` tidy tree → 3D positions within slab bounds
- Zustand layout: shallow tree (store → slices → actions) within slab bounds
- React Query layout: linear chain per query key within slab bounds
- Wire layout engine into RegistryStore's debounced recompute

Verify by logging computed positions for a known set of registered nodes.

---

## Session C — R3F Scene (CLAUDE.md: Layout & Visual, Rendering in DESIGN.md §7)

Build the visible graph with static nodes.

- `GraphScene`: Canvas root, camera, OrbitControls, lighting, bloom pass
- `SlabVolume`: bounding box outline per slab
- `NodeMesh`: sphere at registered position, material driven by NodeState
- `EdgeLine` / `ThreadLine`: intra-slab edges and cross-slab threads
- `HighlightAnimator`: `useFrame` loop — ACTIVE → DIMMED → IDLE transitions, emissive lerp

Goal: full graph visible (low opacity) on load, no interaction needed yet.

---

## Session D — Instrumentation Hooks + Demo Wiring (CLAUDE.md: Core Architecture)

Connect real events to the scene.

- `useRenderTracker`: register component on mount, emit RENDER on every render
- `useEventTracker`: emit USER_EVENT + set cascadeId at interaction boundary
- `zustandLogger` middleware: intercept `set()`, emit STATE_UPDATE
- `useMockQuery`: emit QUERY_START, resolve after 800ms, emit QUERY_SUCCESS (close over cascadeId)
- Register `demoStore` slices + actions at module load
- Update `DemoButton` to use all of the above

One click should produce the full `USER_EVENT → STATE_UPDATE → RENDER → QUERY_START → QUERY_SUCCESS` cascade lighting up the graph.

---

## Session E — Phase 4: UI Panel (CLAUDE.md: Phase Status → Phase 4)

Add the full "deceptively simple" left panel.

- Tab switcher: Button / LoginForm / SearchInput / Toggle
- Each component tracked with `useRenderTracker` + `useEventTracker`
- `SearchInput` debounced → query on change
- Render tree slab updates as components mount/unmount with tab switches
- Layout polish: labels, spacing, dark chrome

---

## Session F — Phase 5: Polish (CLAUDE.md: Phase Status → Phase 5)

Visual finish.

- Bloom tuning (not overwhelming at high node count)
- Traveling dot along thread lines during cross-slab hops
- Entry animation (graph fades in on mount)
- Auto-rotate: starts on load, stops on interaction, resumes after 10s idle