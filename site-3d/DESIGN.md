# Portfolio — DESIGN.md
> A spatial journey. One scroll axis. Three acts. No back button needed.

---

## The Concept

A portfolio that is a place, not a page. The visitor scrolls to orbit a single 3D world, moving through three distinct spaces — each with its own mood, interaction, and reveal. The experience is a zen path: always forward, always discovering, never demanding effort.

**The emotional arc:**
- Act 1: *"Oh, elegant."*
- Act 2: *"Oh wow, there's depth here."*
- Act 3: *"Oh — there's a person here."*

---

## Interaction Model

**Scroll drives everything.**

- Scroll down / right → rotate camera right around the scene
- Scroll up / left → rotate camera left
- Single Y-axis orbit around a central world
- No click-drag, no pan, no zoom

**Three scroll zones:**

| Zone | Camera Angle | Feel |
|------|-------------|------|
| Front | 0° | Locked. Flat illusion. |
| Middle | ~45°–135° | Free orbit. Alive. |
| Final | ~180° | Snaps in. Settles. |

**Rotation arc indicator:** A half-circle HUD at the bottom showing how far you've rotated. Appears once you leave 0°, fades when you return. Disappears entirely once you lock into Act 3.

---

## Act 1 — The Front Face

**The illusion.**

A forced-perspective anamorphic construction. The entire 3D scene is arranged so that from exactly the front camera angle, everything collapses into a flat red square — a Malevich painting. Clean. Almost arrogant.

A single "Download Resume" button lives on it. That's all.

The visitor thinks this is a minimal 2D site. That's the setup.

> Implementation: narrow FOV (orthographic-feel), geometry precisely angled to read as flat from 0°. Illusion is baked into geometry — no head tracking needed.

---

## Act 2 — The Middle World

**Two layers, one scroll.**

As the camera orbits, the flat illusion breaks and the world opens up. There are two things to see as you pass through:

### The Workspace (foreground)

A messy, lived-in creative space. Not an attic — a working environment mid-session.

- Scattered around: cubes and objects with **project GIFs or screenshots** mapped onto their faces as textures
- Click a cube → opens the project URL or GitHub repo in a new tab
- Objects are low-poly, white or near-white, with dramatic lighting and long shadows
- Feels like you walked into someone's studio

**Cursor effect activates here** (e.g. `ideas/cursor-effect-01.js`) — something that trails or reacts, adds physicality to movement.

### The Bridge (background, large, atmospheric)

Far behind the workspace, emerging from fog: a **massive bridge under construction**.

- Each pillar or arch foot represents a place of work / experience
- Pillars are themed: logos, colors, or textures from each company subtly applied
- The bridge recedes into fog — intentionally unfinished, open-ended
- At the far end of the bridge: a large banner, slack and white, like construction hoardings — *"Your logo here"* — the open role slot
- Scale is key: the bridge should feel monumental, distant, slightly melancholic in a good way

---

## Act 3 — The Monolith

**The landing.**

As you continue orbiting, the camera snaps into a white void. Centre stage: **The Monolith** — a tall, dark rectangular slab, standing alone.

Its face glows faintly. It is a touchscreen. It holds Jonatan's files.

### The Files

Three tabs on the Monolith's face:
- `resume.md` — viewable, downloadable
- `info.md` — links, contact, GitHub, LinkedIn
- `late-night-claude.md` — a lost file; easter egg; something weird

Select a tab → content changes on the face. Download button per file.

### GPT-1 (the voice)

A single-question chat at the bottom of the Monolith. Not a conversation. One question, one answer.

The Monolith speaks in the voice of GPT-1 — the first GPT, trained in 2018, now reawakened. Its responses are chaotic, oracular, and unhinged. That's the point.

**Load flow:**
1. User types a question and hits Ask
2. Model downloads (Transformers.js, ~500 MB, with progress bar)
3. Response appears — one generation, no history
4. Token counter shows usage / limit. Reset button clears it.
5. First response sent → triggers Act 4

**Why GPT-1 specifically:**
- Genuinely the first GPT — a historical artifact in the truest sense
- Small enough to run in-browser
- Outputs are chaotic and unpredictable, which is perfect
- No API key, no cost — just a weird little ghost in the machine

> Visual design (lighting, roughness, floor, transitions) is decided in Stage 3 refinement — not in the POC.

---

## Act 4 — The Report

**The reward for finishing.**

After the first message to GPT-1 — or on exit intent if the visitor reached Act 3 — a confetti popover fires.

### Trigger

- Primary: first message sent to GPT-1
- Secondary: exit intent (mouseleave top of viewport) if `act_reached >= 3`

### The Popover

Confetti burst on open. Clean card layout.

**Heading:** *"Visitor #124 — here's how you did."*

**Requires consent before data is written or shown:**
> *"Share anonymous stats to see how you compare?"*  
> `[ ] Yes — show me the numbers`

Once consented, stats appear and one row is written to Supabase.

**Stats block:**

| Stat | Source |
|------|--------|
| Visitor number (#N overall) | Supabase aggregate |
| % who made it past Act 1 | Supabase funnel view |
| % who made it past Act 2 | Supabase funnel view |
| % who typed to GPT-1 | Supabase funnel view |
| Time spent on page | Client-side timer (session start → popover open) |
| Browser jab | `navigator.userAgent`, client-side only, never stored |

**Browser jab examples:**
- *"Still on Chrome? Brave would've rendered this 12% faster."*
- *"Safari detected. Respect."*
- *"Edge? Bold choice. Genuinely."*
- *"Firefox. A person of culture."*

Footer note: *"Continue chatting with GPT-1 →"* (closes popover, returns to terminal)

### Infrastructure

- **Supabase free tier** — single table, client writes via REST, no auth
- Row-level security: `INSERT` only from anon key; reads only via service key
- Schema: `{ id, act_reached, interacted_with_rick, browser_family, time_spent_s, timestamp }`
- Aggregates: Supabase view (`funnel_stats`) — public read-only, no row data exposed
- Consent flag: `localStorage` key `report_consent` — never re-prompt once set
- No cookies, no personal data, no IP stored

---

## Technical Stack (rough)

| Layer | Tool |
|-------|------|
| 3D scene | Three.js |
| UI overlays | Vanilla DOM + Tailwind (see backlog re: React) |
| Scroll → camera | Custom scroll-to-orbit controller |
| Project textures | GIF/PNG mapped onto PlaneGeometry |
| Cursor effects | Custom JS (`ideas/cursor-effect-01.js`) |
| In-browser AI | Transformers.js + GPT-1 from HuggingFace |
| Resume file | Markdown + PDF, served statically |
| Analytics funnel | Supabase (Act 4) |
| Confetti | `canvas-confetti` |

---

## What This Is Not

- Not a chatbot portfolio
- Not a scrolljacking nightmare
- Not a "look how much I know Three.js" flex (the tech is in service of a feeling)
- Not demanding — the visitor can stop at any act and still get something

---

## Open Questions (for later)

- GPT-1 loading time UX — show a "booting historical artifact..." progress bar?
  - sure.
- Does the bridge need interactivity (hover a pillar → see role details) or is ambient enough?
  - ambience is enough, resume got details.
- Cursor effect in Act 3 — gooey (`ideas/GooeyCursor-main/`) still the plan?
  - can do without for now.
