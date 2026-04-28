import { useRenderTracker } from "../../instrumentation/useRenderTracker"
import { useEventTracker } from "../../instrumentation/useEventTracker"
import { useToggleStore } from "../../store/toggleStore"
import { usePrefsQuery } from "../../hooks/useTabQueries"

interface ToggleRowProps {
  label: string
  description: string
  checked: boolean
  onToggle: () => void
}

function ToggleRow({ label, description, checked, onToggle }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-white/70 text-sm">{label}</span>
        <span className="text-white/25 text-[10px]">{description}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
          checked ? "bg-white/40" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  )
}

export function TabToggle() {
  useRenderTracker("toggle-panel", "TogglePanel", "left-panel")
  const { track } = useEventTracker("toggle-panel")
  const { notifications, darkMode, analytics, toggleNotifications, toggleDarkMode, toggleAnalytics } =
    useToggleStore()
  const { run } = usePrefsQuery()

  function handleToggle(action: (cascadeId?: string) => void) {
    const cascadeId = track()
    action(cascadeId)
    run(cascadeId)
  }

  return (
    <div className="flex flex-col gap-5 w-full max-w-[260px]">
      <ToggleRow
        label="Notifications"
        description="Push alerts for activity"
        checked={notifications}
        onToggle={() => handleToggle(toggleNotifications)}
      />
      <div className="border-t border-white/5" />
      <ToggleRow
        label="Dark Mode"
        description="System color scheme"
        checked={darkMode}
        onToggle={() => handleToggle(toggleDarkMode)}
      />
      <div className="border-t border-white/5" />
      <ToggleRow
        label="Analytics"
        description="Usage data collection"
        checked={analytics}
        onToggle={() => handleToggle(toggleAnalytics)}
      />
    </div>
  )
}
