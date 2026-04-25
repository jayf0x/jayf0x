# Stage 3 — Act 3 Implementation Notes

> Concept and design decisions live in root `DESIGN.md → Act 3`. Read that first.
> Known issues and open questions live in `stages/stage-3/backlog.md`.

---

## Iteration 1 scope

Goal: monolith visible, file overlay opens, tab switching works.

- [ ] Monolith geometry visible from 180° camera position
- [ ] Overlay appears when `inAct3 === true`
- [ ] At least one file shown (even static content)
- [ ] Tab switching between files works

GPT-1, download, and token counter are Iteration 2.

---

## File to implement

**`src/scenes/acts/act3/index.js`** — currently a stub with placeholder monolith.

---

## Part 1 — Monolith geometry

```js
import { placeOnFloor } from '../../../utils/scene.js'

const monolith = new THREE.Mesh(
  new THREE.BoxGeometry(1.5, 4, 0.15),
  new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 })
)
placeOnFloor(monolith, 2)   // float slightly: bottom at y=2, centre at y=4
monolith.position.z = -8    // directly in front of the 180° camera
scene.add(monolith)
```

Visual refinement (roughnessMap, dramatic lighting, white floor) is Iteration 2.

---

## Part 2 — File overlay (DOM)

Append to `document.body`. Show/hide via `inAct3` flag from `animate()`.

```
#monolith-overlay
  .monolith-tabs        (resume | info | late-night-claude)
  .monolith-content     (file content area)
  .monolith-actions     (Download button)
```

**File sources:**
- `resume.md` — from `user-info/about.md`. Render as markdown (`bun add marked`).
- `info.md` — write inline: name, GitHub, LinkedIn, email.
- `late-night-claude.md` — from `user-info/late-night-claude.md`. Label the tab unusually.

**Download:** static asset in `public/`. `<a href="/resume.pdf" download>`. No JS needed. (Placeholder link is fine for Iteration 1.)

**Overlay visibility:**
```js
animate({ inAct3 }) {
  overlay.style.display = inAct3 ? 'flex' : 'none'
}
```

---

## Part 3 — GPT-1 chat (Iteration 2)

Single-question input at the bottom of the overlay.

```bash
bun add @huggingface/transformers
```

```js
import { pipeline } from '@huggingface/transformers'

// Load on first submit, not on Act 3 enter
async function loadGpt1(onProgress) {
  return pipeline('text-generation', 'openai-community/openai-gpt', {
    progress_callback: ({ progress }) => onProgress(progress ?? 0),
  })
}

const PREFIX =
  'You are an ancient oracle, reappearing from your honorable grave into the modern world. ' +
  'A futuristic human is asking you a question. Question: '

const result = await generator(PREFIX + userInput, {
  max_new_tokens: 80,
  temperature: 0.9,
})
```

Token counter: `Math.ceil(text.length / 4)`. Track cumulative per session. Show `used / 80`. Reset button clears count + response.

---

## Part 4 — Act 4 trigger

```js
import { initAct4 } from '../../act4/report.js'
const act4 = initAct4()
let firstMessageSent = false

function onFirstMessage() {
  if (firstMessageSent) return
  firstMessageSent = true
  act4.trigger({ actReached: 3 })
}
```

Call `onFirstMessage()` on first GPT-1 response.

---

## Lenis / scroll in Act 3

When camera is locked in Act 3, Lenis continues capturing scroll. This means the user can't scroll the file content without accidentally changing `progress`. Fix in Iteration 2:
- Call `lenis.stop()` when `inAct3` becomes true
- Call `lenis.start()` when `inAct3` becomes false
- Expose `lenis` instance from `core/scroll.js` or pass it as a param

---

## What Stage 3 does NOT own

- Panel, HTML projection — Act 1
- Cube wall — Act 2
- Camera orbit math + Act 3 lock — `Scene.js` (already implemented)
- Monolith visual refinement — Iteration 2
