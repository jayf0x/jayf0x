import { atom } from "jotai";

export interface PerformanceCheckpoint {
  tag: string;
  percentage: number; // 0-100: feature enabled when slider >= this value
}

export type OverrideState = "on" | "off" | "auto";

export function resolveOverride(override: OverrideState, fallback: boolean): boolean {
  if (override === "on") return true;
  if (override === "off") return false;
  return fallback;
}

export const sliderValueAtom = atom<number>(50);
export const checkpointsAtom = atom<PerformanceCheckpoint[]>([]);
export const checkpointOverridesAtom = atom<Record<string, OverrideState>>({});
