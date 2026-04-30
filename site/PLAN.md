# Plan

## Step 1 — Canvas Setup
- Wire R3F `<Canvas>` in App.jsx, fullscreen, orthographic or perspective (far back)
- Background color #faf8f2, no tone mapping
- Add `<HexSurface>` placeholder mesh (fullscreen plane)
- Confirm: warm white page renders, no errors

## Step 2 — POC Shader: Hex Grid + Noise
- Write `hex.vert` (passthrough) and `hex.frag`
- Fragment shader: UV → hex cell math → visualize grid (hard edges ok at this stage)
- Add simplex noise (GLSL implementation inline or imported)
- Drive elevation with layered FBM noise + uTime
- Map elevation → shade (darken hex edges, lighten center)
- Uniform controls via leva: hex scale, noise speed, noise frequency, elevation intensity
- **Confirm: tiles emerge and recede organically. Matches vision feel.**

## Step 3 — Motion Refinement
- Tune FBM layers for ocean-swell character (slow, non-repeating)
- Smooth tile fade in/out (no pop — elevation threshold with soft curve)
- Density variation: low-elevation zones → tiles dissolve; high-elevation → pattern visible
- Confirm: surface feels alive but calm. Rewarding on close inspection.

## Step 4 — Lighting + Shadows
- Approximate surface normals from height field (finite differences in fragment shader)
- Directional light (slow drift over time) — glides, does not snap
- Soft shadow under elevated tile edges
- Avoid sharp specular — diffuse/ambient only

## Step 5 — Polish + Nuance
- Subtle warm glow from beneath elevated tiles (faint color bleed)
- Micro-texture noise on top (barely perceptible surface grain)
- Ensure performance: 60fps on typical laptop GPU
- Remove leva in production build (or hide behind flag)
