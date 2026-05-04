import { useRef, useCallback } from "react";
import { useAtom, useAtomValue } from "jotai";
import { sliderValueAtom, checkpointsAtom } from "../lib/performanceStore";
import { useIsMobile } from "../hooks/useIsMobile";
import { InfoPopover } from "./InfoPopover";

const TICKS = Array.from({ length: 21 }, (_, i) => i * 5);
const SCALE_LABELS = [0, 25, 50, 75, 100];

export const PerformanceSlider = () => {
  const isMobile = useIsMobile();
  const [value, setValue] = useAtom(sliderValueAtom);
  const checkpoints = useAtomValue(checkpointsAtom);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const applyClientX = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const { left, width } = trackRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, Math.round(((clientX - left) / width) * 100)));
      setValue(pct);
    },
    [setValue],
  );

  if (isMobile) return null;

  return (
    <div className="fixed bottom-0 left-1/2 z-30 -translate-x-1/2 select-none w-[clamp(320px,38vw,560px)]">
      <div
        className="rounded-2xl px-5 pt-1"
        style={{
          background: "rgba(6, 6, 8, 0.82)",
          backdropFilter: "blur(16px) saturate(1.4)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{
                background: "var(--accent)",
                boxShadow: "0 0 6px var(--accent)",
                animation: "pulse 2s infinite",
              }}
            />
            <span className="text-[10px] font-mono tracking-[0.22em] uppercase text-[rgba(255,255,255,0.35)]">
              <InfoPopover title="Temperature" items={[
                ['What is LLM temperature', 'https://www.ibm.com/think/topics/llm-temperature']
              ]} />
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold tabular-nums text-[var(--accent)]">
            {String(value).padStart(3, " ")}%
          </span>
        </div>

        {/* Checkpoint labels — positioned above the track */}
        {checkpoints.length > 0 && (
          <div className="relative h-7 mb-0.5">
            {checkpoints.map((cp) => {
              const active = value >= cp.percentage;
              return (
                <div
                  key={cp.tag}
                  className="absolute bottom-0 flex flex-col items-center -translate-x-1/2"
                  style={{ left: `${cp.percentage}%` }}
                >
                  <span
                    className="text-[8px] font-mono uppercase tracking-wider whitespace-nowrap mb-1 transition-colors duration-300"
                    style={{ color: active ? "rgba(221,49,98,0.95)" : "rgba(255,255,255,0.22)" }}
                  >
                    {cp.tag}
                  </span>
                  <div
                    className="transition-colors duration-300"
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: "3px solid transparent",
                      borderRight: "3px solid transparent",
                      borderTop: `5px solid ${active ? "rgba(221,49,98,0.9)" : "rgba(255,255,255,0.18)"}`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Draggable track */}
        <div
          ref={trackRef}
          className="relative cursor-ew-resize"
          style={{ height: 32, touchAction: "none" }}
          onPointerDown={(e) => {
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            applyClientX(e.clientX);
          }}
          onPointerMove={(e) => {
            if (dragging.current) applyClientX(e.clientX);
          }}
          onPointerUp={() => {
            dragging.current = false;
          }}
          onPointerCancel={() => {
            dragging.current = false;
          }}
        >
          {/* Track groove */}
          <div
            className="absolute inset-x-0 overflow-hidden"
            style={{ top: "50%", transform: "translateY(-50%)", height: 8, borderRadius: 4 }}
          >
            <div
              className="absolute inset-y-0 left-0"
              style={{ width: `${value}%`, background: `linear-gradient(90deg, var(--accent) 0%, #8b5cf6 55%, #DD3162 100%)`, opacity: 0.8, boxShadow: "none", border: "1px solid rgba(255,255,255,0.09)", backgroundClip: "padding-box" }}
            />
            <div className="absolute inset-0 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>

          {/* Ruler tick marks */}
          {TICKS.map((tick) => {
            const major = tick % 25 === 0;
            const mid = tick % 10 === 0;
            const lit = tick <= value;
            const h = major ? 14 : mid ? 9 : 5;
            return (
              <div
                key={`slider-tick-${tick}`}
                className="absolute pointer-events-none"
                style={{
                  left: `${tick}%`,
                  bottom: major ? 3 : mid ? 5 : 8,
                  width: 1,
                  height: h,
                  background: lit ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.13)",
                  transform: "translateX(-50%)",
                  borderRadius: 0.5,
                  transition: "background 0.15s",
                }}
              />
            );
          })}

          {/* Checkpoint track marks (glowing bars) */}
          {checkpoints.map((cp) => {
            const active = value >= cp.percentage;
            return (
              <div
                key={cp.tag}
                className="absolute pointer-events-none z-10"
                style={{
                  left: `${cp.percentage}%`,
                  top: 2,
                  bottom: 2,
                  width: 2,
                  borderRadius: 1,
                  transform: "translateX(-50%)",
                  background: active ? "#DD3162" : "rgba(255,255,255,0.3)",
                  boxShadow: active ? "0 0 8px 2px rgba(221,49,98,0.55)" : "none",
                  transition: "background 0.25s, box-shadow 0.25s",
                }}
              />
            );
          })}

          {/* Thumb */}
          <div className="absolute top-0 bottom-0 flex items-center justify-center pointer-events-none z-20" style={{ left: `${value}%`, transform: "translateX(-50%)" }}>
            <div className="flex flex-col items-center justify-center gap-1" style={{ width: 14, height: 26, borderRadius: 4, background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(190,200,230,0.88) 100%)", boxShadow: "0 0 14px rgba(79,124,255,0.6), 0 3px 8px rgba(0,0,0,0.7)" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-sm" style={{ width: 6, height: 1, background: "rgba(0,0,0,0.28)" }} />
              ))}
            </div>
          </div>
        </div>

        {/* Scale labels */}
        <div className="relative mt-1" style={{ height: 14 }}>
          {SCALE_LABELS.map((v) => (
            <span key={v} className="absolute text-[8px] font-mono -translate-x-1/2 tabular-nums" style={{ left: `${v}%`, color: "rgba(255,255,255,0.18)" }}>
              {v}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
