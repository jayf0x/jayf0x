import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  checkpointsAtom,
  checkpointOverridesAtom,
  sliderValueAtom,
  type CheckpointItem,
} from "@/lib/performanceStore";

export const useRegisterCheckpoints = <
  const T extends readonly CheckpointItem[],
>(
  items: T,
) => {
  const setCheckpoints = useSetAtom(checkpointsAtom);

  useEffect(() => {
    setCheckpoints((prev) => {
      const updated = prev.slice();
      for (const item of items) {
        const idx = updated.findIndex(({ tag }) => tag === item.tag);
        if (idx >= 0) {
          updated[idx] = item;
        } else {
          updated.push(item);
        }
      }

      return updated;
    });
  }, [items, setCheckpoints]);
};

export const useCheckpointValue = (tag: CheckpointItem["tag"]) => {
  const sliderValue = useAtomValue(sliderValueAtom);
  const checkpoints = useAtomValue(checkpointsAtom);

  const overrides = useAtomValue(checkpointOverridesAtom);

  const override = overrides[tag] ?? "auto";
  if (override === "on") return true;
  if (override === "off") return false;

  const item = checkpoints.find((c) => c.tag === tag);

  if (!item) return false;

  return item.invert
    ? sliderValue <= item.percentage
    : sliderValue >= item.percentage;
};
