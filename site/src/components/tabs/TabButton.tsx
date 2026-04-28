import { useState } from "react"
import { useRenderTracker } from "../../instrumentation/useRenderTracker"
import { useEventTracker } from "../../instrumentation/useEventTracker"
import { useButtonQuery } from "../../hooks/useTabQueries"

export function TabButton() {
  useRenderTracker("tab-btn", "TabButton", "left-panel")
  const { track } = useEventTracker("tab-btn")
  const { run } = useButtonQuery()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleClick() {
    if (loading) return
    setLoading(true)
    setDone(false)
    const cascadeId = track()
    await run(cascadeId)
    setLoading(false)
    setDone(true)
    setTimeout(() => setDone(false), 1500)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-10 py-3 border border-white/20 text-white text-sm tracking-widest uppercase hover:border-white/60 hover:bg-white/5 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "Loading…" : done ? "Done ✓" : "Click Me"}
      </button>
    </div>
  )
}
