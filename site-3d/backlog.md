# Backlog

Technical open questions that don't block Stage 1. Revisit per act.

---

## GPT-1 / Transformers.js (Act 3)
- `openai-community/openai-gpt` is ~500 MB float32 — heavy browser load
- Verify Transformers.js v3 supports GPT-1 tokenizer + generation
- Fallback: GPT-2 small (124 M params, well-documented support) — same spirit
- Loading UX: "Booting historical artifact…" progress bar while model fetches
- Consider: WebGPU acceleration flag for faster inference

## React vs vanilla (Act 3)
- DESIGN.md says "React UI overlay" for fake editor + terminal
- Vanilla DOM + Tailwind handles both without adding a framework dependency
- Decide at Act 3 implementation time. Lean vanilla unless complexity demands otherwise.

## Mobile handling
- Gyroscope orbit on touch? Or static Act 1 view + no-scroll message?
- Minimum bar: don't crash, degrade gracefully
- Defer until desktop experience is done

## Bridge interactivity (Act 2)
- Hover pillar → role tooltip? Or purely ambient?
- Start ambient; add hover tooltip as a late enhancement

## Cursor effect (Act 2)
- `ideas/cursor-effect-01.js` — noise-driven 3D lines, shark-circles on idle
- Activates when camera enters Act 2 zone, deactivates outside
- Needs integration with Three.js render loop (pass elapsed time + pointer NDC)

## Content assets needed
- Project GIFs / screenshots for Act 2 cube textures (source from `user-info/`)
- Company logos for bridge pillars (Bricsys, etc.)
- Final resume PDF for Act 3 download
- Finalized `info.md` for Act 3 editor (links, contact, GitHub, LinkedIn)

## Act 4 — exit intent reliability
- `mouseleave` top-of-viewport unreliable on mobile and some trackpad gestures
- Fallback: show report trigger as a subtle persistent button once Act 3 is reached
- Don't rely on exit intent as the sole secondary trigger

## Act 4 — Supabase setup (do before Act 4 dev)
- Create project, table `visit_events`, view `funnel_stats`
- Add anon insert key to `.env` (never commit)
- Test RLS: anon can INSERT, cannot SELECT raw rows
- Public read endpoint for `funnel_stats` aggregate only

## IP / location tracking — considered, declined
- Idea: geo-IP jab ("Nice to have you from Ghent!") via ipinfo.io or similar
- Decision: skip. Browser jab covers the "we see you a little" vibe without:
  - External API dependency (latency, failure mode)
  - GDPR surface area (IP = PII)
  - Creepy-vs-fun balance tipping wrong way
- Revisit only if there's a strong narrative reason later

## Physarum background (low priority)
- `ideas/PhysarumTransportNetwork.js` — full simulation
- Consider as ambient floor/background texture in Act 2 or Act 3
- Only if the act feels visually bare after primary geometry is done



---


# General (low)

- in touch screen or mobile, you need to also be able to turn left or right