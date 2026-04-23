# Post-Launch Backlog

Features and improvements for after all three acts are shipped. None of these are required for the POC.

---

## Scene lifecycle / memory management

**Context:** Currently all three acts are initialized on load and rendered every frame. Act 3 is empty stubs, but once it has real geometry and a DOM overlay, everything runs simultaneously.

**Strategy (when performance becomes a concern):**

### Act visibility by scroll zone

Each act module already returns a `dispose()` stub. Implement in Scene.js:

```
progress ∈ [0.00, 0.20]  → Act 1 full, Act 2 skeleton only, Act 3 hidden
progress ∈ [0.20, 0.80]  → Act 1 visible, Act 2 full, Act 3 hidden
progress ∈ [0.80, 1.00]  → Act 1 + 2 skeleton, Act 3 full
```

"Skeleton" = geometry present in scene but shadows disabled, textures unloaded, materials simplified.
"Hidden" = meshes removed from scene, GPU memory freed, DOM overlays display:none.

### Fade-in for Act 2 assets

If the user scrolls fast into Act 2, assets may not be loaded yet. Fade them in:

```js
// In act2.js animate():
const targetOpacity = isLoaded ? 1 : 0
mesh.material.opacity = lerp(mesh.material.opacity, targetOpacity, 0.05)
mesh.material.transparent = mesh.material.opacity < 1
```

### Disposal pattern

Every act's `dispose()` must:
1. `mesh.geometry.dispose()` for all geometries
2. `mesh.material.dispose()` (or `materials.forEach(m => m.dispose())`)
3. `texture.dispose()` for all loaded textures
4. `scene.remove(mesh)` for all added objects
5. DOM: `overlay.style.display = 'none'` or `overlay.remove()`

Memory leaks to watch for:
- Event listeners (always use `removeEventListener` in dispose)
- `THREE.CanvasTexture` from `HtmlToCanvas` — call `h2c.dispose()`
- Transformers.js model — unclear if it can be freed; check the library's docs

### Re-entry (user scrolls back from Act 3)

On re-entry to Act 2 from Act 3:
1. Call `act2.rebuild({ scene })` (add this method to the act interface)
2. Re-add geometry to scene
3. Fade in

Keep `rebuild()` fast: store geometry/material config as closures, don't re-fetch textures.

### Implementation location

`Scene.js` watches `progress` and calls `act.dispose()` / `act.rebuild()` based on thresholds. Acts own their own disposal logic — Scene only orchestrates the timing.

---

## Performance monitoring

- Stats.js is already wired in dev (`src/dev/debug.js`)
- For production: if FPS drops below 30 for 3 seconds, log an event to Supabase (reuse the Act 4 visit_events table with a new `perf_issue` flag)
- `THREE.WebGL1Renderer` fallback for devices without WebGL2 — check `THREE.REVISION` compatibility
- Reduce DPR to 1 on devices where `navigator.hardwareConcurrency <= 2` (weak CPU hint)

---

## Bridge window in Act 3

- Currently: a flat placeholder texture showing the "landscape"
- Full implementation: render Act 2 scene into a `THREE.WebGLRenderTarget`, use as the window texture
- Cost: one extra render pass per frame — not free, but manageable
- Only needed if the static texture looks unconvincing

---

## Mobile — gyroscope orbit

- Alternative to scroll orbit on mobile: use `DeviceMotionEvent` tilt → camera progress
- Requires permission prompt on iOS 13+
- Only implement if touch scroll (Lenis `syncTouch: true`) feels wrong in testing

---

## SEO / shareability

- Add `<meta og:*>` tags to `index.html` for social previews
- Static fallback screenshot for crawlers (Three.js canvas isn't crawlable)
- Consider a `<noscript>` with the resume content as a fallback

---

## Analytics beyond Act 4

- Currently: Supabase funnel tracks act_reached, browser, time_spent
- Post-launch: add `project_clicked` event when a cube is clicked (Act 2)
- Heatmap of scroll progress distribution (which acts are reached most)
- All additive to the existing schema — just new rows with additional event types
