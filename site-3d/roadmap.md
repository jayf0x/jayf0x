# Roadmap

Simple checklist. Check off as sessions complete. Each phase = one or more Claude Code sessions.

---

## Phase 0 — Skeleton `[x]`

**Goal:** Verify all mechanics before building real geometry. One placeholder per act. QA the bones.

- [x] Act 1: red cube with HTML projection
- [x] Act 2: workspace cube (origin) + bridge rock formation (far −x, in fog)
- [x] Act 3: monolith slab at 180° camera position
- [x] Circular camera orbit (true sin/cos, radius 12 m, eye height 1.8 m)
- [x] Weighted scroll pacing via `ORBIT_WEIGHTS`
- [x] `litness` wired — flat HTML illusion at 0°, PBR at orbit
- [x] Act 3 angle-based lock with hysteresis
- [x] `input.clicked` raycaster wired (log commented out for production — re-enable for final QA)
- [x] Stats panel ≥ 60fps
- [x] Mobile: single-finger swipe orbits camera

---

## Phase 1 — Act 1 POC `[ ]`

See `stages/stage-1/DESIGN.md` for full spec.

- [ ] Red panel (`BoxGeometry 16×9×0.15`) with HTML resume button projected cleanly
- [ ] Gallery room walls, floor, ceiling visible on orbit
- [ ] Panel edges invisible at rest (`#faf8f5` bg match)
- [ ] `uLitness` transitions flat→PBR smoothly during orbit
- [ ] Plinth + sculpture in gallery for depth
- [ ] HUD arc indicator appears on scroll, fades at rest
- [ ] Passes visual QA: looks flat at 0°, reveals depth by ~10% scroll

---

## Phase 2 — Act 2 POC `[ ]`

See `stages/stage-2/DESIGN.md` for full spec.

- [ ] ≥ 3 project cubes with placeholder textures (PNG screenshots)
- [ ] Clicking a cube opens the correct URL in a new tab
- [ ] Bridge: ≥ 2 pillars visible in background, recedes into fog
- [ ] "Your logo here" banner at the far end of the bridge
- [ ] Fog sells the scale — bridge doesn't hard-clip
- [ ] Cursor effect activates in Act 2 zone

---

## Phase 3 — Act 3 POC `[ ]`

See `stages/stage-3/DESIGN.md` for full spec.

- [ ] Camera snaps to Act 3 position on enter
- [ ] Monolith geometry visible in white void
- [ ] File overlay shows: `resume.md`, `info.md`, `late-night-claude.md` tabs
- [ ] `resume.md` renders as markdown with download button
- [ ] `late-night-claude.md` tab visible and readable
- [ ] GPT-1 chat: user can type one question and get a response
- [ ] Progress bar shows during model download
- [ ] Token counter visible with reset button
- [ ] First response triggers Act 4 stub (`act4.trigger()`)

---

## Phase 4 — Refinement pass `[ ]`

Polish everything before shipping Act 4.

- [ ] Lighting: more dramatic shadows, workspace spot light, bridge atmosphere
- [ ] `ORBIT_WEIGHTS` tuned — orbit pacing feels cinematic, not mechanical
- [ ] HUD arc polished (smooth draw, right weight)
- [ ] Editor overlay styled to look like a real (fake) editor
- [ ] Terminal UI polished — progress bar, cursor blink, response rendering
- [ ] Cursor effect integrated cleanly (no z-fighting, right activation zone)
- [ ] GLB assets for bridge pillars (if available — not a blocker)
- [ ] Real project screenshots in Act 2 cube textures
- [ ] Mobile tested on real device: orbit, tap-to-click, editor usable
- [ ] No console errors, no memory leaks spotted in DevTools

---

## Phase 5 — Act 4 + Release `[ ]`

See `stages/stage-4/DESIGN.md` for full spec and `stages/stage-4/backlog.md` for prerequisites.

- [ ] Supabase project created, table + view set up, `.env` configured
- [ ] Consent checkbox + localStorage flag working
- [ ] Visitor number + funnel stats displaying correctly
- [ ] Browser jab copy finalized and showing
- [ ] Confetti fires on popover open
- [ ] Popover "Continue chatting with GPT-1 →" closes correctly
- [ ] Exit intent trigger working (desktop only — mobile skip)
- [ ] Performance: acts far from camera skip heavy draw calls (see `stages/post-launch/backlog.md`)
- [ ] Deploy: Vercel / Netlify, domain, HTTPS
- [ ] Supabase anon key in environment variables (not in git)

---

## Icebox (post-launch, no timeline)

See `stages/post-launch/backlog.md` for full detail.

- [ ] Full act dispose/rebuild lifecycle (memory management)
- [ ] Bridge window in Act 3 (render target from Act 2)
- [ ] GLB bridge geometry with textured pillars
- [ ] Mobile gyroscope orbit option
- [ ] SEO / social preview meta tags
- [ ] Analytics: project click events, scroll distribution heatmap
