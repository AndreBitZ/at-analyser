import type { DerivedFilters, Match } from "./types";

export const FIVE_MINUTE = 300;

export const REGULATION_BLOCKS = [
  "P1_00_05",
  "P1_05_10",
  "P1_10_15",
  "P1_15_20",
  "P1_20_25",
  "P1_25_30",
  "P2_30_35",
  "P2_35_40",
  "P2_40_45",
  "P2_45_50",
  "P2_50_55",
  "P2_55_60",
] as const;

export function fiveMinuteBlockIndex(timestampSeconds: number): number {
  return Math.floor(timestampSeconds / FIVE_MINUTE);
}

export function blockCode(timestampSeconds: number, extraTimeSeconds = 0): string {
  const idx = fiveMinuteBlockIndex(timestampSeconds);
  if (idx < REGULATION_BLOCKS.length) return REGULATION_BLOCKS[idx];
  const extraIdx = idx - REGULATION_BLOCKS.length;
  const start = 60 + extraIdx * 5;
  const end = start + 5;
  return `ET_${String(start).padStart(2, "0")}_${String(end).padStart(2, "0")}`;
}

export function matchDurationMinutes(match: Match): number {
  return (match.regulation_duration_seconds + match.extra_time_seconds) / 60;
}

export function derivedFilters(
  timestampSeconds: number,
  scoreDifferenceBefore: number,
  match: Match
): DerivedFilters {
  const end = match.regulation_duration_seconds + match.extra_time_seconds;
  const remaining = end - timestampSeconds;
  return {
    FIRST_HALF: timestampSeconds < 1800,
    SECOND_HALF: timestampSeconds >= 1800 && timestampSeconds <= match.regulation_duration_seconds,
    LAST_15_MINUTES: remaining <= 900 && timestampSeconds <= end,
    LAST_10_MINUTES: remaining <= 600,
    LAST_5_MINUTES: remaining <= 300,
    LAST_2_MINUTES: remaining <= 120,
    CRUNCHTIME: timestampSeconds >= 3000 && Math.abs(scoreDifferenceBefore) <= 2,
  };
}

export function overlapSeconds(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): number {
  return Math.max(0, Math.min(endA, endB) - Math.max(startA, startB));
}

export function blockWindow(index: number): { start: number; end: number } {
  return { start: index * FIVE_MINUTE, end: (index + 1) * FIVE_MINUTE };
}

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
