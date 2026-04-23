# Stage 3 Backlog

---

## GPT-1 Transformers.js compatibility (VERIFY FIRST)
- Before building the terminal UI, confirm GPT-1 loads in-browser:
  ```js
  import { pipeline } from '@huggingface/transformers'
  const gen = await pipeline('text-generation', 'openai-community/openai-gpt')
  console.log(await gen('Hello', { max_new_tokens: 20 }))
  ```
- If it fails to load or tokenizer errors: fall back to `gpt2` (124M, same vibe)
- Document the result in this file before shipping

## GPT-1 model size (~500 MB)
- Loading UX: progress bar from Transformers.js `progress_callback`
- If progress_callback doesn't fire granularly enough: fake it (linear tween over expected load time)
- Consider: cache the model in IndexedDB so repeat visits load instantly (Transformers.js does this automatically with `cache: 'force-cache'` option)

## Editor overlay position on mobile
- The overlay must not be covered by the virtual keyboard when the terminal input is focused
- Use `interactive-widget=resizes-content` (already set in index.html) — browser shrinks viewport, overlay reflows
- Test on iOS Safari: it behaves differently from Android Chrome
- Use `dvh` not `vh` for overlay height

## `marked` package for markdown rendering
- `bun add marked` for resume.md rendering
- Sanitize output: `marked` returns raw HTML. Use DOMPurify or `marked`'s sanitize option to prevent XSS (even if content is controlled, good habit)
- `bun add dompurify`

## PDF resume — asset needed
- Requires an actual PDF file: `public/resume.pdf`
- The download button: `<a href="/resume.pdf" download>Download PDF</a>` — no JS needed
- Placeholder: link to a "coming soon" note until file exists

## Act 4 — Supabase setup required before writing report.js
- See root `backlog.md` → "Act 4 — Supabase setup"
- Needs: project created, table created, anon key in `.env`
- `.env` is gitignored — create `.env.example` with the key name documented

## Editor tab for late-night-claude.md — label decision
- Option A: normal filename, no special treatment
- Option B: `⚠ unexpected_file.md` — more mysterious, slightly hidden in file list
- Option C: Only discoverable by scrolling the sidebar (not shown by default)
- Recommendation: B. Visible but flagged. The easter egg is better if the user finds it themselves.

## Camera Act 3 threshold — tune during development
- Threshold is `ACT3_ZONE = { enter: 0.42, exit: 0.58 }` in `src/config.js` — edit there, not in Scene.js
- The snap lerp rate (`0.05`) is in `Scene.js` — adjust for feel once geometry is in

## Lenis scroll vs. editor interaction in Act 3
- When the camera is snapped to Act 3, Lenis continues intercepting all scroll events
- Problem: user tries to scroll the editor sidebar or markdown content, but Lenis captures it and changes `progress`
- Resolution: when `inAct3 === true`, call `lenis.stop()` and redirect pointer events to the editor overlay; on exit, call `lenis.start()`
- Access Lenis instance from `Scene.js` via a module-level export or pass it as a param to `buildAct3`
- Test on trackpad (two-finger scroll) and mouse wheel — both must be captured
