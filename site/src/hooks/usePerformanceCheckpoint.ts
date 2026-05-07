import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  checkpointsAtom,
  checkpointOverridesAtom,
  sliderValueAtom,
} from "@/lib/performanceStore";

/**
 * Register a performance checkpoint and/or subscribe to one.
 *
 * - Providing `percentage` registers this tag in the store (first caller wins per tag).
 * - Returns `enabled = sliderValue >= threshold` so the caller can opt-out of heavy work.
 */
export const usePerformanceCheckpoint = (tag: string, percentage: number) => {
  const setCheckpoints = useSetAtom(checkpointsAtom);
  const sliderValue = useAtomValue(sliderValueAtom);
  const checkpoints = useAtomValue(checkpointsAtom);

  useEffect(() => {
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

  const overrides = useAtomValue(checkpointOverridesAtom);
  const threshold =
    checkpoints.find((c) => c.tag === tag)?.percentage ?? percentage ?? 0;

  const override = overrides[tag] ?? null;
  if (override !== null) return override;
  return sliderValue >= threshold;
};
