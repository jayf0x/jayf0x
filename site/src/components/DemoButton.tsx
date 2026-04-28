import { queue } from "../instrumentation/queue"
import { useRegistryStore } from "../store/registryStore"
import { useDemoStore } from "../store/demoStore"
import { useMockQuery } from "../hooks/useMockQuery"

useRegistryStore.getState().registerNode({
  id: "demo-button",
  label: "DemoButton",
  type: "COMPONENT",
  slab: "RENDER_TREE",
})

export function DemoButton() {
  const { isLoading, setLoading } = useDemoStore()
  const { run } = useMockQuery()

  async function handleClick() {
    if (isLoading) return
    const cascadeId = queue.newCascade()
    queue.emit("USER_EVENT", "demo-button", cascadeId)
    console.log(`[cascade ${cascadeId.slice(0, 8)}] click → STATE_UPDATE → QUERY_START → (+1.2s) QUERY_SUCCESS`)

    setLoading(true)
    await run(cascadeId)
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-white/20 text-xs tracking-widest uppercase text-center">
        Just a button?
      </p>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="px-8 py-3 border border-white/20 text-white text-sm tracking-widest uppercase hover:border-white/60 hover:bg-white/5 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isLoading ? "Loading…" : "Re-render"}
      </button>
      <p className="text-white/15 text-xs max-w-[180px] text-center leading-relaxed">
        Watch the component tree light up in the graph →
      </p>
    </div>
  )
}
