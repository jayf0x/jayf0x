import { atom } from "jotai";

export interface PerformanceCheckpoint {
  tag: string;
  percentage: number; // 0-100: feature enabled when slider >= this value
}

export const sliderValueAtom = atom<number>(100);
export const checkpointsAtom = atom<PerformanceCheckpoint[]>([]);

// null = follow slider, true = forced on, false = forced off
export const checkpointOverridesAtom = atom<Record<string, boolean | null>>({});
