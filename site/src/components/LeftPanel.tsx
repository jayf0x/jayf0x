import { DemoForm } from "./DemoForm"

export function LeftPanel() {
  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full border-r border-white/10">
      <span className="absolute top-4 left-0 right-0 text-center text-xs text-white/30 tracking-widest uppercase">
        The Interface
      </span>
      <DemoForm />
    </div>
  )
}
