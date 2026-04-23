# Act 3 Backlog

## Phase 0 (current)
- [x] Grey terminal slab at 180° camera position (fills FOV)
- [x] Camera angle-based lock with hysteresis (ACT3_ANGLE_THRESHOLD, ACT3_HYSTERESIS in config.js)

## Stage 3 TODOs
- [ ] Replace slab with real Monolith: `BoxGeometry(1.5, 4, 0.15)`, dark material
- [ ] DOM overlay (#monolith-overlay): tab bar, file list, markdown content area
  - resume.md — preview + PDF download
  - info.md — contact, GitHub, LinkedIn
  - late-night-claude.md — easter egg
- [ ] GPT-1 chat: single-question input, Transformers.js lazy-load, progress bar
- [ ] Tune `ACT3_ANGLE_THRESHOLD` and `ACT3_HYSTERESIS` for desired lock feel
- [ ] Idle camera drift when locked (subtle, keeps scene alive)
- [ ] Act 4 trigger: call `act4.trigger()` on first GPT-1 message

## Known issues
- Transformers.js GPT-1 model cannot be fully unloaded from memory once loaded — no dispose strategy exists yet; tracked in stages/post-launch/backlog.md
- Terminal slab y-position is approximate (1.2 m derived from camera look angle); re-tune in Stage 3 once real geometry is placed
