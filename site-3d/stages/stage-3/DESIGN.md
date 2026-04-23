# Stage 3 — Act 3: The Monolith

> Read `CLAUDE.md` and `DESIGN.md` first, then this file.

**Concept:** The camera settles into a white void. Centre stage: the Monolith — a tall, dark rectangular slab. Its face displays Jonatan's files. At the bottom, a single-question chat interface speaks in the voice of GPT-1.

---

## POC acceptance criteria (Stage 3)

These are the only things that must work before Stage 3 ships:

- [ ] Monolith geometry in scene, visible from Act 3 camera position
- [ ] At least one file (`resume.md`) visible on the monolith face
- [ ] File switching between `resume.md`, `info.md`, `late-night-claude.md`
- [ ] Download button works for the selected file
- [ ] GPT-1 chat: user types one question, gets a response
- [ ] First message triggers the Act 4 stub (`act4.trigger()`)

Everything else — exact lighting, textures, transitions, floor, styling — is post-POC.

---

## File to implement

**`src/scenes/acts/act3.js`** — currently a stub. Replace the TODOs.

---

## Part 1 — Monolith geometry

A tall dark slab. Exact proportions and material will be tuned post-POC.

```js
const monolith = new THREE.Mesh(
  new THREE.BoxGeometry(1.5, 4, 0.15),
  new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 })
)
monolith.position.set(0, 0, -8)
scene.add(monolith)
```

For POC: no roughnessMap, no special lighting, no floor. Add those in the refinement pass.

---

## Part 2 — File display (DOM overlay)

A DOM overlay sits in front of the monolith, aligned to its face. It shows the current file and tab switcher.

### Structure

```
#monolith-overlay
  .monolith-tabs          (resume | info | late-night-claude)
  .monolith-content       (file content — rendered HTML)
  .monolith-actions       (Download button)
```

### Files

- `resume.md` — source from `user-info/about.md`. Render as markdown. `bun add marked`.
- `info.md` — write inline: name, GitHub, LinkedIn, email.
- `late-night-claude.md` — source from `user-info/late-night-claude.md`. Tab label is unusual/subtle — decide at refinement.

### Download

Each file has a corresponding static asset in `public/`:
- `public/resume.pdf` (placeholder link until real PDF exists — see backlog)
- `public/info.txt` or rendered HTML (decide at build time)

Download button: `<a href="/resume.pdf" download>`. No JS needed.

### Overlay visibility

Show when `inAct3 === true` (passed by Scene.js). Hide otherwise.

```js
animate({ inAct3 }) {
  overlay.style.display = inAct3 ? 'flex' : 'none'
}
```

---

## Part 3 — GPT-1 chat

Single-question chat at the bottom of the overlay. Not a conversation — each submit is independent.

### UI

```
┌──────────────────────────────────────────────┐
│ [ Ask the monolith... ]          [ Ask → ]   │
│ ████████████░░░░░░░░░░  42 / 80 tokens  [↺]  │
└──────────────────────────────────────────────┘
```

Response appears above the input, replacing the previous one. No history shown.

### Transformers.js

```bash
bun add @huggingface/transformers
```

```js
import { pipeline } from '@huggingface/transformers'

async function loadGpt1(onProgress) {
  return pipeline(
    'text-generation',
    'openai-community/openai-gpt',
    { progress_callback: ({ progress }) => onProgress(progress ?? 0) }
  )
}
```

Model is loaded on first "Ask" click (lazy — not on Act 3 enter). Progress bar shows download. Input is disabled until ready.

### Prompt framing

GPT-1 has no system prompt support. Frame via prefix:

```js
const PREFIX =
  'You are an ancient oracle, reappearing from your honorable grave into the modern world. ' +
  'A futuristic human is asking you a question. Question: '

const result = await generator(PREFIX + userInput, {
  max_new_tokens: 80,
  temperature: 0.9,
})
```

### Token counter

Estimate tokens as `Math.ceil(text.length / 4)`. Track cumulative tokens used across questions in the session. Show `used / 80` (adjustable limit). Reset button clears the count and clears the response.

### First message → Act 4

```js
import { initAct4 } from '../act4/report.js'
const act4 = initAct4()

function onFirstMessage() {
  act4.trigger({ actReached: 3 })
}
```

Call `onFirstMessage()` once (guard with a flag).

---

## Camera snap

Already implemented in `Scene.js`. When `progress` enters `ACT3_ZONE` (see `src/config.js`), camera lerps to `ACT3_CAMERA_POS`. `act3.animate()` receives `inAct3: boolean`.

Do not re-implement the snap. Just use the `inAct3` flag.

---

## What Stage 3 does NOT own

- Panel, gallery walls — Act 1
- Project cubes, bridge — Act 2
- Camera keyframes for Acts 1 and 2 — Scene.js
- Monolith visual refinement (roughnessMap, lighting drama, floor, transitions) — post-POC
