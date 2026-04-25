# The Hidden Gallery — Design

> A portfolio that is a place, not a page. Scroll to orbit. Three acts. No back button needed.

---

## Concept

The visitor scrolls to rotate a camera around a single 3D world. Each rotation reveals a new act with its own mood and interaction. The experience is a zen path — always forward, always discovering.

**Emotional arc:**
- Act 1: *"Oh, elegant."* — a flat red panel that hides the whole world behind it
- Act 2: *"Oh wow, there's depth here."* — cubes stacked in every direction
- Act 3: *"Oh — there's a person here."* — a monolith holding Jonatan's files and a ghost AI

---

## World Conventions

These apply everywhere. Non-negotiable.

**Coordinates:**
- Floor is at `y = 0`. Everything sits on or above it.
- Camera eye height: `CAMERA_EYE_HEIGHT = 1.8` (metres). Never changes.
- Scale: 1 unit = 1 metre.
- Origin `(0, 0, 0)` is the centre of the world. Camera always looks at it.

**Placing objects:**
- Always use `placeOnFloor(mesh)` from `utils/scene.js` for anything that stands on the floor.
- For floating objects: `placeOnFloor(mesh, yOffset)` where yOffset > 0.
- Never place objects by eyeballing — use the utility or explicit `y = height/2`.

**Camera orbit:**
- Camera moves on a perfect circle, radius `ORBIT_RADIUS = 12`, at `y = CAMERA_EYE_HEIGHT`.
- 0° = Act 1 (front, z+). 90° = Act 2 (right side, x+). 180° = Act 3 (back, z-).
- Scroll drives orbit angle. `ORBIT_WEIGHTS` controls speed per quadrant — tune in `config.js`.
- Act 3 has an angle-based lock + hysteresis (already implemented in `Scene.js`).

**No gallery room:**
- There are no walls, no ceiling, no room. The scene is open.
- Fog (`FogExp2, density 0.022`) handles far bounds.
- The panel in Act 1 is a slab in open space — not framed by a room.

---

## Act 1 — The Front Face

**At 0°:** the scene looks like a flat 2D website. A red panel fills the viewport. One button: "Download Resume".

**On orbit:** the panel reveals it's a 3D slab (BoxGeometry depth). Objects behind it appear. PBR lighting kicks in. The visitor realises this was 3D the whole time.

**How the illusion works:**
1. Panel (`BoxGeometry(16, 9, 0.15)`, color `#fd453a`) fills the viewport at rest.
2. HTML is projected onto the panel face via `createProjector` — looks painted on.
3. `uLitness = 0` at rest → pure flat projection, no 3D shading cues.
4. Background `#faf8f5` matches panel edge colour → edges invisible at 0°.
5. On orbit: `uLitness` ramps up → PBR lighting + panel depth + backing geometry visible.

**What the space behind the panel can contain:** anything, as long as it's occluded from 0°. There is no set design — the Stage 1 agent can decide or leave it empty.

---

## Act 2 — The Cube Wall

**What it looks like:** a landscape of stacked cubes, like a city or a Tetris formation. Visible from the 90° camera position. Most cubes are white or light gray. Some have project screenshots or GIFs on their face. Clicking a textured cube opens the project URL.

**Geometry:** cubes of varying sizes, stacked in a loose grid arrangement. Some taller, some wider. All sitting on the floor (`placeOnFloor`). Clustered roughly around the world origin, slightly offset toward x+ so they're in frame at 90°.

**Interaction:** clicking or tapping a project cube opens its URL in a new tab. Hover may change colour or scale slightly — at minimum one cube must be interactive.

**No bridge in the first two iterations.** The bridge concept (career arc, pillars per employer) is an icebox feature. Don't build it until Acts 1-3 are polished.

---

## Act 3 — The Monolith

**What it looks like:** white void. A tall dark rectangular slab at the centre. Its face is an interactive panel showing three files.

**The files:**
- `resume.md` — Jonatan's bio/experience. Viewable + downloadable.
- `info.md` — Links, GitHub, LinkedIn, email.
- `late-night-claude.md` — Easter egg. A lost file. Something weird.

**Interaction:** tab switching between files. Download button per file. At the bottom: a single-question chat backed by GPT-1 (loaded lazily on first submit).

**GPT-1:** the first GPT, trained in 2018. Not a chat assistant — each question gets one response. Responses are chaotic and oracular. That's the feature.

Prompt framing (prefix, not system prompt — GPT-1 doesn't support one):
```
You are an ancient oracle, reappearing from your honorable grave into the modern world.
A futuristic human is asking you a question. Question: [user input]
```

Token counter (chars / 4 estimate) + reset button. First response triggers Act 4.

**Visual design** (roughnessMap, lighting drama, floor tiles, transitions) — decided in Iteration 2 refinement, not in Iteration 1.

---

## Act 4 — The Report

Fires after the first GPT-1 response (or exit intent if Act 3 was reached).

**Consent gate:** check `localStorage.report_consent`. If not set, show a checkbox before writing anything.

**On consent:** write one row to Supabase, fetch aggregate stats, show a confetti popover.

**Popover:** `"Visitor #N — here's how you did."` + funnel stats + browser jab + "Continue chatting →" button.

**Data collected (anonymous):** act reached, whether they typed to GPT-1, browser family (client-side only), time spent. No IP, no personal data, no cookies.

See `stages/stage-4/DESIGN.md` for Supabase schema, RLS setup, and full implementation spec.

---

## Iteration Plan

### Iteration 1 — Skeleton with interaction

All three acts visible and interactive. Ugly is fine. The goal is to prove every mechanic works end-to-end.

**Act 1:**
- Red panel with HTML projection visible at 0°
- Illusion partially works (panel is a slab, `uLitness` transitions)
- No backing geometry required yet

**Act 2:**
- Cube wall visible from 90° camera position
- At least one cube is clickable (opens a URL) or changes on hover
- Cubes sit on the floor (not floating)

**Act 3:**
- Monolith visible from 180° camera position
- At least one file visible in the overlay (even static/hardcoded content)
- Some interaction: tab switching or a dummy download button

**Act 4:** not in Iteration 1.

---

### Iteration 2 — Content + polish

**Act 1:** illusion polished. Panel edges invisible. HUD arc. Real resume button linked.

**Act 2:** real project textures on cubes. All project cubes clickable. Hover states. Lighting dramatic.

**Act 3:** real file content (markdown rendered). GPT-1 wired and loading. Download working. Token counter.

**All acts:** consistent lighting. 60fps on mid-range laptop. Mobile tested.

---

### Iteration 3 — Act 4 + release

- Supabase project set up, `.env` configured
- Consent gate + popover working end-to-end
- Browser jab copy written
- Confetti fires
- Deploy (Vercel or Netlify, HTTPS, domain)

---

## Icebox

Not in scope for any current iteration. Revisit post-launch.

- **Bridge:** monumental structure in -x direction, pillars per work experience, "Your logo here" banner. Great concept, too much scope for now.
- **Rapier physics:** workspace cubes have rigid bodies — a fast swipe can knock them. Fun idea, changes the orbit model. Post-launch.
- **Cursor effect:** noise-driven 3D lines that follow the pointer (see `ideas/cursor-effect-01.js`). Activate in Act 2 zone.
- **Backing geometry for Act 1:** objects behind the panel that reveal on orbit — adds depth to the illusion. Optional.
- **GPT-1 IndexedDB cache:** Transformers.js can cache the model between visits. Speeds up repeat loads.
- **Act 3 visual refinement:** roughnessMap, dramatic directional lighting, white tiled floor, ink-bleed file transitions.
- **Mobile gyroscope orbit:** `DeviceMotionEvent` tilt as alternative to scroll.
- **Bridge window in Act 3:** render Act 2 into a WebGLRenderTarget and show it through a "window" in Act 3.
