# Stage 4 — Act 4: The Report

> Read `CLAUDE.md` and the root `DESIGN.md` first, then this file.

**Goal:** After the user's first message to GPT-1, fire a confetti popover that shows anonymous funnel stats — how far this visitor got compared to all previous visitors. Gated behind a one-time consent checkbox.

---

## Acceptance criteria

- [ ] Popover fires on first GPT-1 message (triggered via `act4.trigger()` from act3.js)
- [ ] Consent gate shown if `localStorage.report_consent` is not set
- [ ] If consent given: confetti fires, stats are fetched and displayed
- [ ] If consent denied: popover closes silently, nothing written to Supabase
- [ ] "Continue chatting with GPT-1 →" closes the popover
- [ ] Popover is not shown again on repeat trigger (guard with a `triggered` flag)

---

## File to implement

**`src/scenes/act4/report.js`** — stub already exists. Replace the TODO body.

---

## Part 1 — Consent gate

Check `localStorage.getItem('report_consent')` on trigger:

- **Not set:** render the popover in consent mode:
  ```
  ┌──────────────────────────────────────────────┐
  │  Want to see how you compare to other         │
  │  visitors?                                    │
  │                                               │
  │  [ ✓ ] Share anonymous visit stats            │
  │                                               │
  │         [ See my report ]   [ No thanks ]     │
  └──────────────────────────────────────────────┘
  ```
- **Set to `"yes"`:** skip consent UI, go directly to stats flow
- **Set to `"no"`:** do nothing (user previously declined)

On "See my report": set `localStorage.report_consent = "yes"`, proceed to Part 2.
On "No thanks": set `localStorage.report_consent = "no"`, close popover.

---

## Part 2 — Supabase write

Write one row to the `visit_events` table:

```js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

await supabase.from('visit_events').insert({
  act_reached: actReached,          // number (1–3)
  interacted_with_gpt1: true,       // boolean
  browser_family: detectBrowser(),  // string — client-side only, never stored as UA
  time_spent_s: Math.round(timeSpentMs / 1000),
  // timestamp auto-set by Supabase default
})
```

**RLS policy:** anon role has INSERT only. No SELECT on raw rows. Enforced at DB level.

### Supabase table schema

```sql
create table visit_events (
  id            bigserial primary key,
  act_reached   smallint not null,
  interacted_with_gpt1 boolean not null default false,
  browser_family text,
  time_spent_s  integer,
  created_at    timestamptz default now()
);
```

---

## Part 3 — Aggregate stats fetch

Read from the public view `funnel_stats` (no auth required):

```js
const { data } = await supabase
  .from('funnel_stats')
  .select('*')
  .single()

// data shape:
// { total_visitors, pct_past_act1, pct_past_act2, pct_typed_to_gpt1, visitor_number }
```

### Supabase view definition

```sql
create view funnel_stats as
select
  count(*)                                          as total_visitors,
  round(100.0 * count(*) filter (where act_reached >= 1) / count(*), 1) as pct_past_act1,
  round(100.0 * count(*) filter (where act_reached >= 2) / count(*), 1) as pct_past_act2,
  round(100.0 * count(*) filter (where interacted_with_gpt1) / count(*), 1) as pct_typed_to_gpt1
from visit_events;
```

`visitor_number` = `total_visitors` at time of this user's insert (i.e., after INSERT, re-fetch).

---

## Part 4 — Browser jab

Detect browser client-side only. Never stored as raw UA — only the `browser_family` string.

```js
function detectBrowser() {
  const ua = navigator.userAgent
  if (/Edg\//.test(ua))    return 'Edge'
  if (/OPR\//.test(ua))    return 'Opera'
  if (/Chrome\//.test(ua)) return 'Chrome'
  if (/Firefox\//.test(ua)) return 'Firefox'
  if (/Safari\//.test(ua)) return 'Safari'
  return 'Unknown'
}
```

Browser jab strings (pick based on `browser_family`):

| Browser | Jab |
|---------|-----|
| Chrome | "Chrome. Bold." |
| Firefox | "Firefox. Respect." |
| Safari | "Safari. You own a Mac." |
| Edge | "Edge. Brave choice." |
| Opera | "Opera. Tell me more about yourself." |
| Unknown | "Unknown browser. Respect the mystery." |

---

## Part 5 — Confetti

```bash
bun add canvas-confetti
```

```js
import confetti from 'canvas-confetti'

// Fire on popover open (after consent confirmed, before stats render)
confetti({
  particleCount: 120,
  spread: 70,
  origin: { y: 0.6 },
})
```

---

## Part 6 — Popover DOM

```html
<div id="act4-popover" class="...">
  <h2>Visitor #N — here's how you did.</h2>

  <ul class="stats-block">
    <li>X% of visitors made it past Act 1</li>
    <li>X% made it past Act 2</li>
    <li>X% typed something to GPT-1</li>
    <li>You're one of them.</li>
  </ul>

  <p class="browser-jab">[browser jab string]</p>

  <button id="act4-close">Continue chatting with GPT-1 →</button>
</div>
```

- Appended to `document.body`
- Centered, blurred backdrop (`backdrop-filter: blur`)
- `#act4-close` sets `popover.remove()` and returns focus to terminal input

---

## Dependencies to add in Stage 4

```bash
bun add @supabase/supabase-js canvas-confetti
```

---

## What Stage 4 does NOT own

- GPT-1 terminal, editor overlay — Act 3
- Camera keyframes — Scene.js
- `.env` setup — see root `backlog.md` → "Act 4 — Supabase setup"
