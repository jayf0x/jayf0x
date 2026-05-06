import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { checkpointsAtom, sliderValueAtom } from "../lib/performanceStore";

/**
 * Register a performance checkpoint and/or subscribe to one.
 *
 * - Providing `percentage` registers this tag in the store (first caller wins per tag).
 * - Returns `enabled = sliderValue >= threshold` so the caller can opt-out of heavy work.
 */
export const usePerformanceCheckpoint = (tag: string, percentage?: number) => {
  const setCheckpoints = useSetAtom(checkpointsAtom);
  const sliderValue = useAtomValue(sliderValueAtom);
  const checkpoints = useAtomValue(checkpointsAtom);

  useEffect(() => {
    if (percentage === undefined) return;
    setCheckpoints((prev) => {
      const idx = prev.findIndex((c) => c.tag === tag);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { tag, percentage };
        return updated;
      }
      return [...prev, { tag, percentage }];
    });
  }, [tag, percentage, setCheckpoints]);

  const threshold =
    checkpoints.find((c) => c.tag === tag)?.percentage ?? percentage ?? 0;

  return sliderValue >= threshold;
};
