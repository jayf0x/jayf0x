# Act 2 Backlog

## Phase 0 (current)
- [x] Blue workspace cube placeholder at origin
- [x] Bridge rock formation placeholder far outside orbit on −x axis
- [x] Raycaster wired (click log commented out — re-enable for final QA)

## Stage 2 TODOs
- [ ] Replace workspace cube with real project meshes (BoxGeometry + face textures from /public/projects/)
- [ ] `window.open(projectUrl, '_blank')` on raycast hit
- [ ] Cursor-effect-01 integration (pass `input.ndc` + `elapsed` each frame)
- [ ] Procedural bridge geometry: pillars, arches, deck
- [ ] Per-pillar company branding (logo texture + accent colour)
- [ ] "Your logo here" banner at far end of bridge (PlaneGeometry + canvas texture)
- [ ] Tune bridge position / scale once real geometry exists

## Known issues
- Bridge currently a single dark box — enough for fog/atmosphere QA, not final geometry
- Bridge raycast disabled (bridge is not a project link target)
