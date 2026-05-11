import { atom } from "jotai";

export type CheckpointItem = {
  tag: Capitalize<string>;
  percentage: number;
  invert?: boolean;
};

export type OverrideState = "on" | "off" | "auto";

export const sliderValueAtom = atom<number>(50);
export const checkpointsAtom = atom<CheckpointItem[]>([]);
export const checkpointOverridesAtom = atom<Record<string, OverrideState>>({});
