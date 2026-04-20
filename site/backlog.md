# Backlog

## Product/UI

- [ ] Consolidate project content into one section
  - Keep only one canonical `Selected Work` section for project cards.
  - Remove duplicated project listing from hero/top area.

- [ ] Replace top duplicate projects with lightweight activity carousel
  - Add a carousel in the top section that shows top N recently updated projects.
  - Use repo `pushed_at` (or local fallback) to rank recency.

- [ ] Simplify resume UX
  - Remove resume preview image everywhere.
  - Keep only a download action.
  - Evaluate placing resume download CTA in hero/top section and remove standalone resume section.

- [ ] Upgrade project card layout to large banner format
  - Move to apple.com-style large visuals.
  - Keep copy minimal and structured.
  - Use one consistent card structure across all projects.

- [ ] Add standardized project actions
  - Per project: GitHub link, GitHub Pages link (disabled when missing), Releases link.
  - Make disabled states explicit and visually consistent.

- [ ] Add stack icon row on project cards
  - Show top 2 stack icons per project from metadata.
  - Define a clear fallback when an icon is unknown.

- [ ] Add unique gradient overlays per project preview
  - Assign one overlay gradient per project.
  - Example format: `linear-gradient(360deg, #ff6c008f, #00e1ff70)`.
  - Keep text readability intact over overlays.

## Reliability/UX

- [ ] Fix scroll spy/nav sync behavior
  - Improve active-section detection so dots track scrolling reliably.
  - Validate with fast scroll and section boundary edge cases.

- [ ] Resolve incomplete theme application
  - Ensure theme toggle updates all colors and fonts consistently.
  - If full consistency is not ready, temporarily remove/disable toggle.

## User checklist

- [ ] Confirm top carousel count (default suggestion: 3)
- [ ] Choose final resume CTA location (`Hero` or `Footer`)
- [ ] Confirm whether temporary theme-toggle removal is acceptable
- [ ] Approve project action priority/order (GitHub, Pages, Releases)
- [ ] Provide/approve stack-to-icon mapping for top projects
- [ ] Approve per-project overlay gradients (or let system generate defaults)
