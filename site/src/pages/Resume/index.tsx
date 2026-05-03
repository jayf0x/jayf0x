import { memo, useEffect, useRef } from "react"
import { createConwayEngine } from "../../lib/conway/conway"
import { FileHeart } from "lucide-react"

import "./styles.css"

export const Resume = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    return createConwayEngine(canvasRef.current!)
  }, [])

  return (
    <div className="size-full relative overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 size-full block" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
        <span className="text-[#9994] text-sm uppercase">The red button</span>
        <div className="ad-float pointer-events-auto">
          <a
            href="https://raw.githubusercontent.com/jayf0x/jayf0x/main/assets/Jonatan-Verstraete-resume-2026.pdf"
            download
            className="no-underline"
          >
            
            <div id="red-button" className="flex size-full center" aria-label="Download resume" title="Download PDF">
              <FileHeart size={42} className="m-auto opacity-60" />
            </div>
          </a>
        </div>

         <span className="text-[#9994] text-xs uppercase">Press Space to pause</span>
      </div>
    </div>
  )
})
