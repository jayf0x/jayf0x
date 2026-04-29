import { useState, useEffect, useRef } from "react"
import { useRenderTracker } from "../../instrumentation/useRenderTracker"
import { useSearchStore } from "../../store/searchStore"
import { useSearchQuery } from "../../hooks/useTabQueries"
import { useRegistryStore } from "../../store/registryStore"
import { queue } from "../../instrumentation/queue"

const DEBOUNCE_MS = 400

export function TabSearch() {
  useRenderTracker("search-input", "SearchInput", "left-panel")
  const { query, setQuery } = useSearchStore()
  const { run } = useSearchQuery()
  const [searching, setSearching] = useState(false)
  const [resultCount, setResultCount] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    const cascadeId = queue.newCascade()
    queue.emit("USER_EVENT", "search-input", cascadeId)
    // view → method, view → query (not store root)
    const reg = useRegistryStore.getState()
    reg.registerEdge("search-input", "set-query")
    reg.registerEdge("search-input", "q-search-key")
    setQuery(val, cascadeId)

    if (timerRef.current) clearTimeout(timerRef.current)
    setResultCount(null)

    if (!val.trim()) return
    setSearching(true)
    timerRef.current = setTimeout(async () => {
      await run(cascadeId)
      setSearching(false)
      setResultCount(Math.floor(Math.random() * 80) + 1)
    }, DEBOUNCE_MS)
  }

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  return (
    <div className="flex flex-col gap-4 w-full max-w-[260px]">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search anything…"
          className="w-full bg-transparent border border-white/15 text-white text-sm px-3 py-2 pr-8 outline-none focus:border-white/40 transition-colors placeholder:text-white/15"
        />
        {searching && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 text-xs animate-pulse">
            ●
          </span>
        )}
      </div>
      <p className="text-white/20 text-xs">
        {searching
          ? "Searching…"
          : resultCount !== null
            ? `${resultCount} results`
            : query
              ? "Type to search"
              : ""}
      </p>
    </div>
  )
}
