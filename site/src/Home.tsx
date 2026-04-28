import { LeftPanel } from "./components/LeftPanel"
import { RightPanel } from "./components/RightPanel"

export function Home() {
  return (
    <div className="flex w-full h-full bg-[#0a0a0a] text-white">
      <div className="w-1/2 h-full">
        <LeftPanel />
      </div>
      <div className="w-1/2 h-full">
        <RightPanel />
      </div>
    </div>
  )
}
