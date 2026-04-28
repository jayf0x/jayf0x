# Roadmap

Progress tracker. Each iteration = one or more sessions. Check off as work completes.

---

## Phase 0 — Skeleton `[x]`

Mechanics verified. All core systems working.

- [x] Circular orbit (sin/cos, radius 12 m, eye height 1.8 m)
- [x] Weighted scroll pacing (`ORBIT_WEIGHTS`)
- [x] `litness` wired — flat HTML illusion at 0°, PBR at orbit
- [x] Act 3 angle-based lock with hysteresis
- [x] `input.clicked` raycaster wired
- [x] `placeOnFloor()` utility in `utils/scene.js`
- [x] Stats panel ≥ 60fps
- [x] Mobile: single-finger swipe orbits camera

---

## Iteration 1 — Visible + interactive `[ ]`

**Goal:** all three acts visible and interactive. Rough is fine. Prove every mechanic end-to-end.

See `DESIGN.md → Iteration 1` for the acceptance bar per act.

- [ ] Act 1: red panel visible at 0°, HTML projection works, `uLitness` transitions visible
- [ ] Act 2: snow globe visible at 90°, Rapier physics running, snow falling, at least one project panel clickable
- [ ] Act 3: monolith visible at 180°, file overlay opens, tab switching works
- [ ] No floating objects — everything placed with `placeOnFloor()`
- [ ] No console errors
- [ ] 60fps on mid-range laptop

---

## Iteration 2 — Content + polish `[ ]`

**Goal:** real content in every act. Looks intentional.

- [ ] Act 1: illusion polished (edges invisible at 0°), HUD arc, real resume content
- [ ] Act 2: all project panels clickable, shake gesture, frosted glass boundary, snow tuned, dramatic lighting
- [ ] Act 3: markdown rendered, GPT-1 loading + responding, download working, token counter
- [ ] Mobile tested on real device (orbit, tap, overlay)
- [ ] No memory leaks visible in DevTools

---

## Iteration 3 — Act 4 + release `[ ]`

See `stages/stage-4/DESIGN.md` for full spec.

- [ ] Supabase project set up, table + view created, `.env` configured
- [ ] Consent gate + localStorage flag working
- [ ] Visitor number + funnel stats displaying
- [ ] Confetti fires on popover open
- [ ] Browser jab copy written and showing
- [ ] Popover closes cleanly
- [ ] Deploy: Vercel or Netlify, HTTPS, domain
- [ ] Supabase anon key in environment variables (not in git)

---

## Icebox

See `DESIGN.md → Icebox` for descriptions.

- [ ] Bridge (work experience arc)
- [ ] Rapier physics advanced (shake gesture, prop tipping)
- [ ] Cursor effect in Act 2 zone
- [ ] Act 1 backing geometry
- [ ] Act 3 visual refinement (lighting, roughnessMap, floor, transitions)
- [ ] GPT-1 IndexedDB caching
- [ ] Bridge window in Act 3
- [ ] Mobile gyroscope orbit
- [ ] SEO / social preview meta tags
