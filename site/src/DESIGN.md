# Design

## Philosophy

Information first. Every visual element either carries meaning or disappears.
Not a portfolio that *looks* technical — a site built by someone who actually is.
The reference: Chrome DevTools, designed by Apple. Clinical structure, one moment of genuine beauty.

---

## Typeface

**One typeface. Two registers.**

```
font-family: "Berkeley Mono", ui-monospace, "SF Mono", monospace;
```

Everything — headings, prose, labels, metadata — in the same monospace face.
No pairing, no contrast hierarchy through family switching.
Hierarchy through size and weight alone.

Scale (nothing in between):

| Token     | Size   | Weight | Use                          |
|-----------|--------|--------|------------------------------|
| `--t-xl`  | 4rem   | 700    | Name / display               |
| `--t-md`  | 1rem   | 400    | Body prose                   |
| `--t-sm`  | 0.75rem| 400    | Labels, metadata, timestamps |

Line-height: `1` for display, `1.6` for prose. Nothing else.
Letter-spacing: `0` everywhere except `--t-sm` labels at `0.08em`.

---

## Color

**One background. One surface. One accent. Four spectrum colors.**

```css
:root {
  --bg:       #0b0b0d;
  --surface:  #111114;
  --line:     rgba(255,255,255,0.06);
  --text:     #e2e2e6;
  --sub:      #555560;
  --accent:   #e8ff3c;   /* sharp chartreuse — not blue, not safe */
}
```

The accent is intentional. `#e8ff3c` is the color of a test that just passed.
It appears in exactly three places: the active nav marker, external link hover state, focus ring.

**Spectrum tokens** — one per project, used only as that project's identity color.
These are spectral positions from the reference image: the prismatic diagonal.

```css
:root {
  --s-0: #ff3d6b;   /* PIIPAYA        — hot magenta */
  --s-1: #00cfff;   /* Pure-Paste     — cyan        */
  --s-2: #7b61ff;   /* fluidity       — violet      */
  --s-3: #ff8c00;   /* Timesheet      — amber       */
}
```

These colors appear **only** on that project's name and its single accent dot.
Nowhere else. No backgrounds. No gradients. One word, one color.

---

## Grid

Hard 12-column CSS Grid. `1fr` columns, 24px gap. Max-width 1120px, centered.

```css
.layout {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 24px;
}
```

Sections are separated by a full-width `1px` horizontal rule (`--line`).
No padding between sections — the rule IS the separator.
Vertical rhythm: multiples of 24px only.

---

## Sections

### Hero

No animations. No typing. No chevron.

```
Jonatan Vons                           [gh] [mail] [cv]
Frontend engineer · Ghent · BE
```

Two lines. Name left-aligned in `--t-xl`. Role/location in `--t-sm --sub`.
Right-aligned: three icon links, 20×20px, `--sub` by default, `--accent` on focus.
Full viewport height? No. 120px top padding, 80px bottom. It's a header, not a stage.

### Projects

A table. Not cards.

Each row:

```
██  PIIPAYA                 PII anonymizer for Bricsys legal review    Tauri · Svelte · Python    ↗
```

- Left: 8×8px circle in `--s-N` (the project's spectrum color)
- Name: `--t-md` weight 700, color `--s-N`
- Description: `--t-sm --sub`, single line, truncated
- Tags: `--t-sm --sub`, dot-separated, no pills, no borders
- Right: `↗` external link or `—` if private

Rows separated by `--line`. No background on rows.
Hover: row background lifts to `--surface`. No transition delay — immediate.

**No images in the project list.**

If a project has a preview worth showing, it expands inline on click:
the row height animates open, the image fills the space edge-to-edge within the grid.
One image, full-bleed, no border-radius, no overlay. Just the screenshot.

### About

Three sentences of prose. `--t-md`. Full-width column span.
No icons. No cards. No bullet points.

### Footer

One line.

```
Jonatan Vons · 2025 · Ghent                    GitHub  /  Email
```

---

## What to Drop

| Element                   | Why                                                |
|---------------------------|----------------------------------------------------|
| Mac window chrome         | Cosplay. The work isn't a screenshot of Finder.    |
| Fake terminal prompts     | The real terminal exists.                          |
| Typing animations         | Information delivered on arrival, not performed.   |
| Gradient overlays on images | Images speak. Color wash muffles them.           |
| File path section labels  | Clever once, annoying at scroll depth 3.           |
| Dot grid background       | Visual noise that adds no signal.                  |
| Stack pill row            | A CV line item. Put it in the About text.          |
| Framer Motion `whileInView` | The work doesn't need to enter dramatically.     |
| `react-type-animation`    | Drop the library.                                  |

---

## The One Moment

You have `@jayf0x/fluidity-js`.

Use it once, on purpose, full-bleed. A 100vw × 280px canvas between the hero and the projects section. No labels. No caption. Just the WebGL output — fluid, alive, yours.

It doesn't need to say anything. It just needs to exist.

---

## Implementation Notes

**Font**: Berkeley Mono is available via [berkeleygraphics.com](https://berkeleygraphics.com) (paid) or `ui-monospace` as fallback. Consider Commit Mono (free) as an alternative — similar register, open license.

**Animations**: Remove Framer Motion from all section-level components. Keep it only for the project row expand/collapse (`AnimatePresence` + `height` animation, `duration: 0.15`, `ease: "easeOut"`). No scroll-triggered fade-ups.

**Background**: `--bg` only. No dot grid, no noise, no blobs. The content creates the visual structure.

**Theme**: Dark only, for now. When light mode is added, `--bg: #f7f7f5`, `--surface: #efefed`, `--line: rgba(0,0,0,0.07)`, `--sub: #888`, `--text: #111`. The spectrum colors stay identical — they read on both.

**Responsive**: At < 768px, the project table collapses to name + circle only. Tags and description hidden. Same font, same structure, less columns.

**Accessibility**: `prefers-reduced-motion` wrapper around the expand animation. Focus ring: `2px solid var(--accent)`, `outline-offset: 3px`. No custom `:focus` — only `:focus-visible`.
