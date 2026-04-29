import { useState } from "react"
import { useRenderTracker } from "../instrumentation/useRenderTracker"
import { useRegistryStore } from "../store/registryStore"
import { TabButton } from "./tabs/TabButton"
import { TabLoginForm } from "./tabs/TabLoginForm"
import { TabSearch } from "./tabs/TabSearch"
import { TabToggle } from "./tabs/TabToggle"

const TABS = ["Button", "Form", "Search", "Toggle"] as const
type Tab = (typeof TABS)[number]

export function LeftPanel() {
  useRenderTracker("left-panel", "LeftPanel")
  const [activeTab, setActiveTab] = useState<Tab>("Button")

  function switchTab(tab: Tab) {
    if (tab === activeTab) return
    // Clear thread lines from the previous cascade before showing new tab
    useRegistryStore.getState().clearCrossSlabEdges()
    setActiveTab(tab)
  }

  return (
    <div id="page" className="relative flex flex-col w-full h-full bg-[#0a0a0a] border-r border-white/10">
      {/* Header */}
      <div className="flex flex-col gap-3 px-6 pt-6 pb-4 border-b border-white/8">
        <span className="text-white/25 text-[10px] tracking-widest uppercase">
          The Interface
        </span>
        {/* Tab bar */}
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              className={`px-4 py-1.5 text-xs tracking-wider uppercase transition-colors duration-100 border-b-2 ${
                activeTab === tab
                  ? "text-white border-white/60"
                  : "text-white/30 border-transparent hover:text-white/50 hover:border-white/20"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex flex-1 items-center justify-center px-6 py-8">
        {activeTab === "Button" && <TabButton />}
        {activeTab === "Form"   && <TabLoginForm />}
        {activeTab === "Search" && <TabSearch />}
        {activeTab === "Toggle" && <TabToggle />}
      </div>

      {/* Footer hint */}
      <p className="text-center text-white/12 text-[10px] tracking-wider pb-4 pointer-events-none">
        Watch the graph react →
      </p>
    </div>
  )
}
