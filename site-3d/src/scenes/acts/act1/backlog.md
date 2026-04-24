# Act 1 Backlog

## Phase 0 (current)
- [x] Red placeholder cube with HTML projection

## Stage 1 TODOs
- [ ] Replace placeholder cube with real panel: `BoxGeometry(16, 9, 0.15)`, color `0xfd453a`, `placeOnFloor(panel, 4.5)`
- [ ] Verify panel edges are invisible at rest — `#faf8f5` background match must hold exactly
- [ ] Add any backing 3D geometry at `z < 0` that reinforces the illusion on orbit (optional — open scene, no room, no walls)
- [ ] Tune `ORBIT_WEIGHTS[0]` for the desired Act 1 "resistance" feel
- [ ] `uLitness` transition: verify flat→PBR looks smooth at ~5–10% scroll
- [ ] HUD arc indicator: appears on scroll, fades at rest

## Known issues
- Projector paints all 6 cube faces — Stage 1 panel is front-face only (fix with UV mask in projected-material.js or by using a PlaneGeometry face overlay)
- `projector.update()` called before the async CSS/font load resolves; texture updates correctly on the next frame anyway
