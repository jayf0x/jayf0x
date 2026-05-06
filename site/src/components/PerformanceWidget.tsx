import { useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useAtom, useAtomValue } from "jotai";
import {
  sliderValueAtom,
  checkpointsAtom,
  checkpointOverridesAtom,
} from "@/lib/performanceStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import { InfoPopover } from "./InfoPopover";

const TICKS = Array.from({ length: 21 }, (_, i) => i * 5);
const SCALE_LABELS = [0, 25, 50, 75, 100];

const AMBER = "#f59e0b";
const AMBER_DIM = "rgba(245,158,11,0.18)";
const AMBER_MID = "rgba(245,158,11,0.4)";
const AMBER_GLOW = "rgba(245,158,11,0.08)";

type OverrideState = boolean | null;

function cycleOverride(current: OverrideState): OverrideState {
  if (current === null) return true;
  if (current === true) return false;
  return null;
}

const OVERRIDE_LABEL: Record<string, string> = {
  true: "on",
  false: "off",
  null: "auto",
};

export const PerformanceWidget = () => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useAtom(sliderValueAtom);
  const checkpoints = useAtomValue(checkpointsAtom);
  const [overrides, setOverrides] = useAtom(checkpointOverridesAtom);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const applyClientX = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const { left, width } = trackRef.current.getBoundingClientRect();
      const pct = Math.max(
        0,
        Math.min(100, Math.round(((clientX - left) / width) * 100)),
      );
      setValue(pct);
    },
    [setValue],
  );

  const toggleOverride = useCallback(
    (tag: string) => {
      setOverrides((prev) => {
        const next = cycleOverride(prev[tag] ?? null);
        if (next === null) {
          const { [tag]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [tag]: next };
      });
    },
    [setOverrides],
  );

  if (isMobile) return null;

  return (
    <div className="flex flex-col items-end gap-2">
      {/* Expandable speech bubble panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="perf-panel"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-[380px] select-none"
            style={{ transformOrigin: "bottom right" }}
          >
            <div
              className="rounded-2xl px-5 pt-4 pb-4"
              style={{
                background: "rgba(6, 6, 8, 0.94)",
                backdropFilter: "blur(20px) saturate(1.5)",
                border: `1px solid ${AMBER_DIM}`,
                boxShadow: `0 8px 40px rgba(0,0,0,0.65), 0 0 0 1px ${AMBER_GLOW} inset, 0 0 32px ${AMBER_GLOW}`,
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{
                      background: AMBER,
                      boxShadow: `0 0 6px ${AMBER}`,
                      animation: "pulse 2s infinite",
                    }}
                  />
                  <span className="text-[10px] font-mono tracking-[0.22em] uppercase text-[rgba(255,255,255,0.35)]">
                    <InfoPopover
                      title="Temperature"
                      items={[
                        [
                          "About LLM temperature",
                          "https://www.promptingguide.ai/introduction/settings#:~:text=Temperature",
                        ],
                        [
                          "Why the link above is inaccurate",
                          "https://dev.to/hermup299/llm-predictability-vs-determinism-2idb",
                        ],
                      ]}
                    />
                  </span>
                </div>
                <span
                  className="text-[11px] font-mono font-bold tabular-nums"
                  style={{ color: AMBER }}
                >
                  {String(value).padStart(3, " ")}%
                </span>
              </div>

              {/* Checkpoint labels above slider */}
              {checkpoints.length > 0 && (
                <div className="relative h-7 mb-0.5">
                  {checkpoints.map((cp) => {
                    const overridden = (overrides[cp.tag] ?? null) !== null;
                    const active = value >= cp.percentage;
                    return (
                      <div
                        key={cp.tag}
                        className="absolute bottom-0 flex flex-col items-center -translate-x-1/2"
                        style={{ left: `${cp.percentage}%` }}
                      >
                        <span
                          className="text-[8px] font-mono uppercase tracking-wider whitespace-nowrap mb-1 transition-colors duration-300"
                          style={{
                            color: overridden
                              ? "rgba(255,255,255,0.18)"
                              : active
                                ? "rgba(245,158,11,0.95)"
                                : "rgba(255,255,255,0.22)",
                          }}
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
                            borderTop: `5px solid ${
                              overridden
                                ? "rgba(255,255,255,0.1)"
                                : active
                                  ? "rgba(245,158,11,0.9)"
                                  : "rgba(255,255,255,0.18)"
                            }`,
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
                  style={{
                    top: "50%",
                    transform: "translateY(-50%)",
                    height: 8,
                    borderRadius: 4,
                  }}
                >
                  <div
                    className="absolute inset-y-0 left-0"
                    style={{
                      width: `${value}%`,
                      background: `linear-gradient(90deg, #f59e0b 0%, #ef4444 60%, #DD3162 100%)`,
                      opacity: 0.85,
                      border: "1px solid rgba(255,255,255,0.09)",
                      backgroundClip: "padding-box",
                    }}
                  />
                  <div
                    className="absolute inset-0 rounded"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  />
                </div>

                {/* Ruler ticks */}
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
                        background: lit
                          ? "rgba(255,255,255,0.55)"
                          : "rgba(255,255,255,0.13)",
                        transform: "translateX(-50%)",
                        borderRadius: 0.5,
                        transition: "background 0.15s",
                      }}
                    />
                  );
                })}

                {/* Checkpoint track marks */}
                {checkpoints.map((cp) => {
                  const overridden = (overrides[cp.tag] ?? null) !== null;
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
                        background: overridden
                          ? "rgba(255,255,255,0.15)"
                          : active
                            ? AMBER
                            : "rgba(255,255,255,0.3)",
                        boxShadow:
                          !overridden && active
                            ? "0 0 8px 2px rgba(245,158,11,0.55)"
                            : "none",
                        transition: "background 0.25s, box-shadow 0.25s",
                      }}
                    />
                  );
                })}

                {/* Thumb */}
                <div
                  className="absolute top-0 bottom-0 flex items-center justify-center pointer-events-none z-20"
                  style={{ left: `${value}%`, transform: "translateX(-50%)" }}
                >
                  <div
                    className="flex flex-col items-center justify-center gap-1"
                    style={{
                      width: 14,
                      height: 26,
                      borderRadius: 4,
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,220,150,0.9) 100%)",
                      boxShadow:
                        "0 0 14px rgba(245,158,11,0.5), 0 3px 8px rgba(0,0,0,0.7)",
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="rounded-sm"
                        style={{
                          width: 6,
                          height: 1,
                          background: "rgba(0,0,0,0.28)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Scale labels */}
              <div className="relative mt-1" style={{ height: 14 }}>
                {SCALE_LABELS.map((v) => (
                  <span
                    key={v}
                    className="absolute text-[8px] font-mono -translate-x-1/2 tabular-nums"
                    style={{ left: `${v}%`, color: "rgba(255,255,255,0.18)" }}
                  >
                    {v}
                  </span>
                ))}
              </div>

              {/* Per-checkpoint override list */}
              {checkpoints.length > 0 && (
                <div
                  className="mt-4 pt-3 space-y-1"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {checkpoints.map((cp) => {
                    const override = overrides[cp.tag] ?? null;
                    const sliderActive = value >= cp.percentage;
                    const effective = override !== null ? override : sliderActive;

                    return (
                      <div
                        key={cp.tag}
                        className="flex items-center justify-between gap-3 py-1"
                      >
                        {/* Tag + effective state dot */}
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-300"
                            style={{
                              background: effective
                                ? override !== null
                                  ? "#34d399"
                                  : AMBER
                                : "rgba(255,255,255,0.15)",
                              boxShadow: effective
                                ? override !== null
                                  ? "0 0 5px rgba(52,211,153,0.6)"
                                  : `0 0 5px rgba(245,158,11,0.5)`
                                : "none",
                            }}
                          />
                          <span
                            className="text-[11px] font-mono uppercase tracking-wider truncate transition-colors duration-200"
                            style={{
                              color:
                                override !== null
                                  ? "rgba(255,255,255,0.7)"
                                  : "rgba(255,255,255,0.35)",
                            }}
                          >
                            {cp.tag}
                          </span>
                          <span
                            className="text-[9px] font-mono tabular-nums flex-shrink-0"
                            style={{ color: "rgba(255,255,255,0.2)" }}
                          >
                            @{cp.percentage}%
                          </span>
                        </div>

                        {/* Override toggle */}
                        <button
                          type="button"
                          onClick={() => toggleOverride(cp.tag)}
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded-md flex-shrink-0 transition-all duration-150"
                          style={{
                            background:
                              override === true
                                ? "rgba(52,211,153,0.12)"
                                : override === false
                                  ? "rgba(248,113,113,0.1)"
                                  : "rgba(255,255,255,0.04)",
                            border:
                              override === true
                                ? "1px solid rgba(52,211,153,0.3)"
                                : override === false
                                  ? "1px solid rgba(248,113,113,0.25)"
                                  : "1px solid rgba(255,255,255,0.07)",
                            color:
                              override === true
                                ? "#34d399"
                                : override === false
                                  ? "#f87171"
                                  : "rgba(255,255,255,0.28)",
                          }}
                        >
                          <span
                            className="w-1 h-1 rounded-full flex-shrink-0"
                            style={{
                              background:
                                override === true
                                  ? "#34d399"
                                  : override === false
                                    ? "#f87171"
                                    : "rgba(255,255,255,0.25)",
                            }}
                          />
                          <span className="text-[9px] font-mono uppercase tracking-wider">
                            {OVERRIDE_LABEL[String(override)]}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Speech bubble tail */}
            <div
              className="absolute -bottom-[5px] right-[19px]"
              style={{
                width: 10,
                height: 10,
                background: "rgba(6,6,8,0.94)",
                border: `1px solid ${AMBER_DIM}`,
                borderTop: "none",
                borderLeft: "none",
                transform: "rotate(45deg)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger button — always visible, matches ChatWidget FAB size */}
      <motion.button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
        style={{
          background: isOpen
            ? "rgba(245,158,11,0.15)"
            : "rgba(10,10,14,0.88)",
          backdropFilter: "blur(14px)",
          border: `1px solid ${isOpen ? AMBER_MID : AMBER_DIM}`,
          boxShadow: isOpen
            ? `0 0 28px rgba(245,158,11,0.2), 0 4px 20px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset`
            : "0 4px 20px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.06) inset",
          color: AMBER,
        }}
      >
        <Sparkles size={18} strokeWidth={1.5} />
        <motion.span
          className="absolute inset-0 rounded-full pointer-events-none"
          initial={{ opacity: 0.35, scale: 1 }}
          animate={{ opacity: 0, scale: 1.6 }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
          style={{
            border: `1px solid ${AMBER_DIM}`,
            background: "rgba(245,158,11,0.05)",
          }}
        />
      </motion.button>
    </div>
  );
};
