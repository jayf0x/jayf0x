# STYLE GUIDE

## Scope
This guide defines the simplified direction for the personal site UI and interaction model.

## Core decisions
- Single-page layout with smooth scrolling sections.
- Only one project listing section: `Selected Work`.
- No resume preview image; resume is exposed as a download CTA.
- Prefer simple, consistent structure over one-off variants.

## Layout rules
- Hero is lightweight and should not duplicate full project cards.
- Hero may include a compact "recently updated" project carousel.
- `Selected Work` is the only section with full project detail cards.
- Each project card follows the same structure and spacing.

## Project card spec (canonical)
- Large banner-first visual (dominant element).
- Minimal text: name, short description, concise metadata.
- Actions row:
  - GitHub
  - GitHub Pages (disabled if unavailable)
  - Releases
- Tech row: top 2 stack icons.
- Overlay: unique per-project color gradient.

## Visual language
- Keep dark-first precision style.
- Maintain strong contrast and readable overlays.
- Avoid visual repetition by varying per-project gradient overlays only, not structure.

## Navigation
- Dot nav must stay in sync with active section while scrolling.
- Active indicator should be stable at section boundaries.

## Theme behavior
- Theme toggle must update all scoped colors and typography tokens.
- If partial theming remains, disable toggle until full token coverage is in place.

## Accessibility and states
- Disabled links (e.g., missing GitHub Pages) must look and behave disabled.
- All action controls must preserve keyboard focus visibility.
- Overlay and text color combinations must remain legible.

## Data-driven rules
- Recent projects for hero carousel should be sorted by last update timestamp.
- Project card fields and availability states should come from metadata, with safe fallbacks.
