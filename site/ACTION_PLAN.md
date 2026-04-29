# Action Plan

Source of truth: `backup/phase2.md`. Each stage maps to one or more focused agent sessions.

---

## Stage 0 — Housekeeping ✓

- [x] Rewrite `CLAUDE.md` to reflect `backup/phase2.md` as source of truth
- [x] Audit `src/html2canvas/` — all 5 files documented and kept (see CLAUDE.md)
- [x] Audit existing components — no hard conflicts; notes below
- [x] Create `ACTION_PLAN.md` (this file)
- [x] Remove dev-only `autoRotate` from `GraphScene`

**Component audit notes:**
- `GraphScene`, `NodeMesh`, `EdgeLine`, `ThreadLine` — clean, no conflicts
- `SlabVolume` — explicit border boxes at 0.12 opacity; Track B will soften/remove them
- Instrumentation hooks, Zustand stores, layout engine — all stable, keep as-is

---

## Stage 1 — Track A: The Illusion + Reveal

Goal: user's first experience is a convincing flat webpage. Rotating breaks the illusion.

### Session 1A — Projected Slab

- Wire `src/html2canvas/` into the R3F scene:
  - Instantiate `HtmlToCanvas` on one of the left-panel tab UIs (LoginForm or resume content)
  - Call `collectDocumentCss()` to embed Tailwind/fonts
  - Create `createProjector({ camera: projectorCamera, texture })` using a frozen clone of the scene camera at its default position
  - Add a `BoxGeometry(30, 17, 0.4)` mesh at scene origin, apply projector
  - `projector.update()` in `useFrame`
- Camera default: directly in front of slab, slight elevation, looking at origin (no auto-rotate)
- `uLitness` driven by angular offset from rest position (0 = flat illusion, 1 = full PBR as camera rotates)

### Session 1B — Reveal Transition

- Engine nodes (Track B graph) visible at very low opacity from rest position
- As camera rotates past ~30°, engine opacity increases to full
- Animate `uLitness` based on camera's angle from default position
- Optional: brief one-shot particle burst / ripple at the slab edge at the reveal moment
- Optional: "keep going" hint after ~5s idle near the reveal threshold

---

## Stage 2 — Track B: Engine Density + Complexity

Goal: the engine looks and feels like a real system, not a tutorial diagram.

### Session 2A — Depth and Layout Improvements

- Add Z variation to nodes within each slab proportional to hierarchy depth (render tree: children further back)
- Offset slabs in X/Z (not just Y) — Zustand slightly to the side and behind, React Query further below and centered
- Soften or remove `SlabVolume` border boxes; replace with faint floating label above each cluster

### Session 2B — Cross-Cutting Connections

- Context provider threads: cross-within-render-tree arcs from provider to each consumer
- Polling arc: looping connection from interval node → query node → affected render nodes (not a straight line)
- Prop drilling: thin stream line from source to consumer tracing the component path when depth > 2

### Session 2C — Additional Complexity Layers

- **Polling / interval node**: standalone node that pulses every ~5s independently, connects to query layer and back to render nodes
- **File ghost layer**: sparse file/module nodes above the render tree; faint reference lines from each component to its source file; does not participate in cascades; can be hardcoded paths
- **Auth flow**: named cascade triggered by the login form tab — `form submit → authStore action → loading state → success/error → re-renders`; distinct highlight path

### Session 2D — Visual Density

- Target 30–50+ visible nodes in default view
- Ghost nodes (idle, very low opacity) fill out the structure
- No forced symmetry — vary slab offsets until it reads as a real engine room, not a diagram

---

## Stage 3 — Final Touches

### Session 3A — Traveling Light Pulse

- Small bright point travels along edge lines from node to node when a cascade fires
- Arrives at each node just before it activates
- Speed controlled by `cascadeHopDelay`

### Session 3B — Idle Breathing + Micro-interactions

- Slow random low-opacity flickers on ghost nodes when idle (system feels alive)
- Subtle camera oscillation at rest (not full rotate, tiny drift)
- Rotation-triggered one-shot effect at the reveal moment (particles or ripple from slab edge)

### Session 3C — Node Inspect

- Click a node: pin tooltip showing node type, label, activation count this session, cascade IDs that triggered it
- Dismiss on click elsewhere

### Session 3D — Ghost / Replay Mode (stretch)

- Button replays last cascade in slow motion (3× slower, traveling pulse only, no new events)

---

## Architecture constraints (always apply)

- Graph built once at load time — nodes never move or spawn after first layout
- `html2canvas` projection and 3D engine share one Three.js renderer and scene
- Instrumentation pipeline (`useRenderTracker`, `useEventTracker`, `zustandLogger` → queue → highlight system) is not restructured unless there is a specific performance reason
- Left panel is HTML over canvas, not projected
- Cascade ID: capture synchronously, close over in async callbacks
- All tunable visual parameters in Leva during dev; hardcoded for prod
