# Project: Calm Procedural Hex Surface

## Vision
Fullscreen living surface. Background #faf8f2 (near-white warm). Hexagonal tiles hidden at rest, revealed by slow organic motion. Shaders-only — no real hex geometry.

Key feel:
- Calm > active. Most of the time: flat, invisible.
- Motion like wind over water — continuous, non-mechanical.
- Tiles emerge via elevation/shading, not hard borders.
- Density variation: calm zones = tiles dissolve; active zones = pattern legible.
- Later: lighting glides across surface, soft shadows under elevated tiles.

## Stack
- React 19 + Vite
- `@react-three/fiber` v9 (R3F)
- `@react-three/drei` v9
- `leva` — debug controls
- No additional geometry libs — fullscreen plane + custom GLSL

## Architecture
Hybrid: real geometry + custom shader. Single fullscreen `<mesh>`.

**Geometry**: `<planeGeometry args={[w, h, w/10, h/10]} />` — ~10px per segment, ~4-5 vertices per hex tile.

**Vertex shader** (all the heavy lifting):
- Maps each vertex UV → pixel coords → hex cell ID
- Samples FBM noise at the cell *centre* (not vertex pos) → all verts in a tile share the same Z offset + face normal
- Computes hex face normal from 2 adjacent cell heights (cross product of tangent vectors)
- Displaces vertex Z by `elevation * uElevAmp`
- Passes `vPx` (pixel coords), `vElev` (elevation mask), `vNormal` (face normal) to fragment

**Fragment shader**:
- Recomputes hex grid from `vPx` for accurate per-fragment rim coloring (avoids UV interpolation discontinuities)
- Rim shadow: `smoothstep(0.30, 0.48, hexDist(gv)) * vElev * uShadowStr`
- Lambert variation: `(dot(N,L) - 0.5) * vElev * uLightStr * 0.06` — centred so facing tiles go lighter, away-facing tiles go darker, both only visible when elevated

**Camera**: orthographic, position [0,0,100], far 300 — Z displacement never clips.

Uniforms:
- `uTime`, `uResolution`, `uHexScale`
- `uNoiseSpeed`, `uNoiseFreq`, `uElevation`, `uElevAmp`
- `uShadowStr`, `uLightStr`, `uLightDir` (auto-animated in useFrame)

## Hex Math (fragment shader)
Use axial/offset hex grid math. Key: map UV → hex cell center + local coords within cell.
Hex size in UV space controls tile density.

## Noise Strategy
Layered FBM (fractional Brownian motion) simplex noise:
- Low freq layer → broad "ocean swell" regions
- Mid freq layer → tile-level elevation variation
- High freq layer (subtle) → micro-surface texture

Height field drives:
1. Tile visibility (fade in/out based on elevation)
2. Shade (darker toward hex edges when elevated, lighter center)
3. Later: normal approximation for lighting

## Dev Commands
- `bun run dev` — start dev server
- `bun run build` — production build
- `bun run dd` — clear vite cache + dev

## File Structure
```
src/
  App.jsx          — R3F Canvas setup
  main.jsx         — ReactDOM entry
  index.css        — global styles (Tailwind base + body reset)
  components/
    HexSurface.jsx — mesh + shaderMaterial + useFrame
  shaders/
    hex.vert       — vertex shader (GLSL)
    hex.frag       — fragment shader (GLSL)
```

## Color Palette
- Page bg: `#faf8f2`
- Tile base (calm): same as bg, imperceptible
- Tile shadow edge: ~`#e8e4d8` (warm gray, very subtle)
- Elevated tile highlight: slight warm white
- Later: subtle warm amber glow from beneath elevated tiles

## Leva Controls (debug)
- Tile size / hex scale
- Noise speed / frequency
- Elevation intensity
- Shadow strength
- (Later) Light position / color
