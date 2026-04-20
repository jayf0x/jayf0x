import { useEffect, useState } from "react"

export const useScrollSpy = (sectionIds: string[]) => {
  const [activeSection, setActiveSection] = useState(sectionIds[0] ?? "")

  useEffect(() => {
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null)

    if (!sections.length) return

    // Track each section's visibility ratio so we can pick the most visible one
    // even when a tall section never fully fits the trigger window.
    const ratioMap = new Map<string, number>(sections.map((s) => [s.id, 0]))

    const pick = () => {
      let bestId = sectionIds[0] ?? ""
      let bestRatio = -1
      for (const [id, ratio] of ratioMap) {
        if (ratio > bestRatio) {
          bestRatio = ratio
          bestId = id
        }
      }
      setActiveSection(bestId)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratioMap.set(entry.target.id, entry.intersectionRatio)
        }
        pick()
      },
      {
        root: null,
        // Bias toward top of viewport so the section heading triggers activation
        // before the user is halfway through. Keeps dots in sync on fast scroll.
        rootMargin: "-10% 0px -80% 0px",
        threshold: Array.from({ length: 21 }, (_, i) => i * 0.05),
      }
    )

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  // sectionIds is a stable module-level constant — but eslint needs the dep listed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionIds])

  return activeSection
}
