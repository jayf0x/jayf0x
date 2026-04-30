import { FluidImage } from "@jayf0x/fluidity-js"
import { useEffect } from "react"

export const Background = () => {
  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const x = event.clientX / window.innerWidth
      const y = event.clientY / window.innerHeight
      document.documentElement.style.setProperty("--mx", x.toFixed(4))
      document.documentElement.style.setProperty("--my", y.toFixed(4))
    }

    window.addEventListener("mousemove", onMouseMove, { passive: true })
    return () => window.removeEventListener("mousemove", onMouseMove)
  }, [])

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* <div className="absolute inset-0">
        <FluidImage src="https://imgs.search.brave.com/BDtHeDKlmUMewX1DupomoFQNHq7PQdiAzSdva1yfrNM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93YWxs/cGFwZXJzLmNvbS9p/bWFnZXMvaGQvZmFu/Y3ktYmFja2dyb3Vu/ZC02N3hnNXptem1n/bno1dGd2LmpwZw" style={{
          width: "100vw",
          height: "100vw",
        }} />
      </div> */}
      <div className="absolute inset-0 opacity-[0.16]">
        <svg
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            transform: "translate3d(calc(var(--mx, 0) * 8px), calc(var(--my, 0) * 8px), 0)",
          }}
        >
          <defs>
            <pattern id="dotPattern" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotPattern)" className="text-[var(--muted)]" />
        </svg>
      </div>

      <div className="blob absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#4f7cff] to-[#8b5cf6] opacity-[0.08] blur-3xl" />
      <div className="blob absolute -bottom-40 -right-40 h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-[#4f7cff] to-[#8b5cf6] opacity-[0.08] blur-3xl [animation-delay:3s]" />
    </div>
  )
}
