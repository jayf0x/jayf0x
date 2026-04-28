/**
 * Emits a RENDER event to the event bus on every render of the host component.
 * Tracks render count via ref so it never re-triggers effects.
 */

import { useEffect, useRef } from "react"
import { eventBus } from "./eventBus"

let idCounter = 0
const nextId = () => `evt-${++idCounter}-${Date.now()}`

export function useRenderTracker(componentName: string, triggeredBy?: string): string {
  const renderCount = useRef(0)
  const currentId = useRef(nextId())

  renderCount.current += 1

  // Emit synchronously during render via effect flush — we use a layout effect
  // so the node appears immediately after paint, not deferred by a microtask.
  useEffect(() => {
    const id = currentId.current
    eventBus.emit({
      id,
      type: "RENDER",
      label: `${componentName} #${renderCount.current}`,
      timestamp: Date.now(),
      triggeredBy,
    })
    // Assign a fresh ID for the next render
    currentId.current = nextId()
  })

  return currentId.current
}
