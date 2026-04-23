/**
 * Act 4 — The Report
 *
 * A confetti popover that fires after the user's first message to GPT-1
 * (or on exit intent if they reached Act 3). Shows anonymous visit stats
 * compared to all previous visitors, with a consent gate before writing
 * anything to Supabase.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * TODO (Stage 4) — implement:
 *
 *   1. Consent gate:
 *      - Check localStorage key `report_consent`
 *      - If not set: show checkbox ("Share anonymous stats to see how you compare?")
 *      - If consented: write row to Supabase, fetch aggregate stats, show popover
 *
 *   2. Supabase write:
 *      - Row: { act_reached, interacted_with_rick, browser_family, time_spent_s, timestamp }
 *      - Use anon key from import.meta.env.VITE_SUPABASE_ANON_KEY
 *      - Insert-only RLS — no read of raw rows
 *
 *   3. Supabase read (aggregate view only):
 *      - Endpoint: Supabase view `funnel_stats` — public read-only
 *      - Fields: total_visitors, pct_past_act1, pct_past_act2, pct_typed_to_gpt1
 *
 *   4. Browser jab:
 *      - Detect browser from navigator.userAgent (client-side only, never stored)
 *      - Map to a jab string (see DESIGN.md for examples)
 *
 *   5. Confetti:
 *      - `bun add canvas-confetti` when Stage 4 starts
 *      - Fire on popover open (not on consent checkbox)
 *
 *   6. Popover DOM:
 *      - Append to document.body
 *      - Heading: "Visitor #N — here's how you did."
 *      - Stats block
 *      - Browser jab
 *      - Footer: "Continue chatting with GPT-1 →" (closes popover)
 *
 * See stages/stage-4/DESIGN.md for full spec.
 * See backlog.md → "Act 4 — Supabase setup" for prerequisites.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * @returns {{ trigger: (stats: { actReached: number, timeSpentMs: number }) => void }}
 */
export function initAct4() {
  const sessionStart = Date.now()

  return {
    /**
     * Call this from act3.js on first GPT-1 message.
     * @param {{ actReached: number }} opts
     */
    trigger({ actReached = 3 } = {}) {
      // TODO (Stage 4): implement full flow
      console.log('[Act 4] trigger called — implement in Stage 4', {
        actReached,
        timeSpentMs: Date.now() - sessionStart,
      })
    },
  }
}
