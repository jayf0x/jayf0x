# Stage 4 Backlog

---

## Supabase setup — required before any code (do this first)

Before writing a single line of `report.js`, the database must exist:

1. Create Supabase project at supabase.com (free tier)
2. Run table + view SQL from `DESIGN.md` Parts 2 and 3
3. Set RLS: anon INSERT on `visit_events`, no SELECT on raw rows
4. Grant SELECT on `funnel_stats` to anon role
5. Copy `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` into `.env`
6. Test with a manual insert + select via Supabase dashboard

Do not start implementing `report.js` until step 6 passes.

## visitor_number race condition

- Two users could INSERT at the same millisecond — both see the same `total_visitors`
- This is acceptable: off-by-one in a vanity counter doesn't matter
- Do not add a DB sequence or transaction for this

## Confetti on repeat visits

- `localStorage.report_consent = "yes"` skips consent and goes straight to stats
- On repeat visit, `act4.trigger()` fires confetti + shows stats again (no harm, fun surprise)
- If this feels spammy: add a `localStorage.report_shown_at` timestamp and suppress if < 24h

## Supabase anon key is public

- The anon key is visible in client JS — this is by design (Supabase model)
- RLS is the security layer, not key secrecy
- Make sure RLS policies are set before going live (see "Supabase setup" above)
- Never use the service_role key in client code

## Fallback if Supabase is unreachable

- Network error on INSERT: swallow silently, still show popover with no stats ("Could not load visitor count")
- Do not block the popover on Supabase availability

## canvas-confetti bundle size

- `canvas-confetti` is ~7 KB minified — acceptable
- It is lazy-loaded inside `report.js` which is only imported by act3.js
- No tree-shaking concern; the whole file is tiny

## Mobile popover layout

- On small screens, the popover must not be taller than the viewport
- Use `max-height: 90dvh` + `overflow-y: auto` on the popover container
- Test on iOS Safari (keyboard + address bar take viewport space)
