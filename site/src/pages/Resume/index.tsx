import { memo, useEffect, useRef, useState } from "react";
import { createConwayEngine, ConwayControls } from "../../lib/conway/conway";
import { FileHeart, Info, Pause, Play } from "lucide-react";

import "./styles.css";
import { InfoPopover } from "../../components/InfoPopover";

type SimMode = "conway" | "daynight";

export const Resume = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ConwayControls | null>(null);
  const [simMode, setSimMode] = useState<SimMode>("conway");
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    // Full reinit on mode change — clean slate
    const engine = createConwayEngine(
      canvasRef.current,
      simMode === "conway",
      {},
    );
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [simMode]);

  const handleModeToggle = (next: SimMode) => {
    if (next === simMode) return;
    setIsPaused(false);
    setSimMode(next);
  };

  const handlePlayPause = () => {
    setIsPaused((prev) => {
      const next = !prev;
      engineRef.current?.setPaused(next);
      return next;
    });
  };

  return (
    <div className="size-full relative overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 size-full block" />

      {/* Center overlay — resume download */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
        <span className="text-[#9994] text-sm uppercase">Download PDF</span>
        <div className="ad-float pointer-events-auto">
          <a
            href="https://raw.githubusercontent.com/jayf0x/jayf0x/main/assets/Jonatan-Verstraete-resume-2026.pdf"
            download
            className="no-underline"
          >
            <div
              id="red-button"
              className="flex size-full center"
              aria-label="Download resume"
              title="Doubt everything. Find your own light. - Buddha"
            >
              <FileHeart size={42} className="m-auto opacity-60" />
            </div>
          </a>
        </div>
      </div>

      {/* Bottom-left controls */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 pointer-events-auto">
        {/* Play / Pause */}
        <button
          onClick={handlePlayPause}
          title={isPaused ? "Play" : "Pause"}
          className="sim-ctrl-btn"
        >
          {isPaused ? <Play size={14} /> : <Pause size={14} />}
        </button>

        {/* Mode toggle */}
        <div className="sim-mode-toggle">
          <button
            onClick={() => handleModeToggle("conway")}
            className={simMode === "conway" ? "active" : ""}
          >
            Conway
          </button>
          <button
            onClick={() => handleModeToggle("daynight")}
            className={simMode === "daynight" ? "active" : ""}
          >
            Day &amp; Night
          </button>
        </div>

        <InfoPopover
          title="More info"
          items={[
            ["More examples", "https://golly.sourceforge.io/webapp/golly.html"],
            ["Useful info", "https://members.tip.net.au/~dbell/"],
          ]}
        />
      </div>
    </div>
  );
});
