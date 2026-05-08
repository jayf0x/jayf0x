import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  checkpointsAtom,
  checkpointOverridesAtom,
  sliderValueAtom,
  resolveOverride,
} from "@/lib/performanceStore";

export const usePerformanceCheckpoint = (
  tag: string,
  percentage: number,
  invert = false,
) => {
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
    checkpoints.find((c) => c.tag === tag)?.percentage ?? percentage ?? NaN;

  const override = overrides[tag] ?? "auto";
  return resolveOverride(
    override,
    invert ? sliderValue <= threshold : sliderValue >= threshold,
  );
};

export const usePerformanceCheckpointValue = (
  tag: Capitalize<string>,
  invert = false,
) => {
  const sliderValue = useAtomValue(sliderValueAtom);
  const checkpoints = useAtomValue(checkpointsAtom);

  const overrides = useAtomValue(checkpointOverridesAtom);
  const threshold = checkpoints.find((c) => c.tag === tag)?.percentage ?? NaN;

  const override = overrides[tag] ?? "auto";
  return resolveOverride(
    override,
    invert ? sliderValue <= threshold : sliderValue >= threshold,
  );
};
