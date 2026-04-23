# Act 1 Backlog

## Phase 0 (current)
- [x] Red placeholder cube with HTML projection

## Stage 1 TODOs
- [ ] Replace 2×2×2 cube with real panel: `BoxGeometry(16, 9, 0.15)`, color `0xfd453a`
- [ ] Add gallery room: walls, floor, ceiling — invisible from 0°, reveals on orbit
- [ ] Anamorphic trick: background objects aligned to panel silhouette at exactly 0°
- [ ] Tune `ORBIT_WEIGHTS[0]` for the desired Act 1 "resistance" feel
- [ ] `uLitness` transition: verify flat→PBR looks smooth at ~5–10% scroll

## Known issues
- Projector paints all 6 cube faces — Stage 1 panel is front-face only (fix with UV mask in projected-material.js)
- `projector.update()` called before the async CSS/font load resolves; texture updates correctly on the next frame anyway
