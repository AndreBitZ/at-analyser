import type { Match, MatchEvent, Stint } from "./types";
import { blockWindow, matchDurationMinutes, overlapSeconds } from "./time";

export function minutesPlayed(stints: Stint[]): number {
  return stints.reduce((acc, s) => acc + Math.max(0, s.end_timestamp - s.start_timestamp), 0) / 60;
}

export function minutesPlayedInBlock(stints: Stint[], blockIndex: number): number {
  const { start, end } = blockWindow(blockIndex);
  return (
    stints.reduce((acc, s) => acc + overlapSeconds(s.start_timestamp, s.end_timestamp, start, end), 0) /
    60
  );
}

export function usagePercentage(stints: Stint[], match: Match): number {
  const dur = matchDurationMinutes(match);
  if (!dur) return 0;
  return (minutesPlayed(stints) / dur) * 100;
}

export function actionsPer10min(actions: number, minutes: number): number | null {
  if (!minutes) return null;
  return (actions / minutes) * 10;
}

export function actionsPer5min(actions: number, minutes: number): number | null {
  if (!minutes) return null;
  return (actions / minutes) * 5;
}

export function playerOnCourt(stints: Stint[], playerId: string, ts: number): boolean {
  return stints.some(
    (s) => s.player_id === playerId && s.start_timestamp <= ts && ts < s.end_timestamp
  );
}

export function onCourtPlayers(stints: Stint[], teamId: string, ts: number): Stint[] {
  return stints.filter(
    (s) => s.team_id === teamId && s.start_timestamp <= ts && ts < s.end_timestamp
  );
}

export function onCourtGoalBalance(
  events: MatchEvent[],
  stints: Stint[],
  playerId: string,
  teamId: string
) {
  const playerStints = stints.filter((s) => s.player_id === playerId);
  let goalsFor = 0;
  let goalsAgainst = 0;
  for (const ev of events) {
    if (ev.type !== "GOAL" && ev.shot?.shot_result !== "GOAL") continue;
    if (!playerOnCourt(playerStints, playerId, ev.timestamp_seconds)) continue;
    if (ev.shot?.attacking_team_id === teamId || (ev.type === "GOAL" && ev.team_id === teamId)) {
      goalsFor += 1;
    } else {
      goalsAgainst += 1;
    }
  }
  const mp = minutesPlayed(playerStints);
  const diff = goalsFor - goalsAgainst;
  return {
    goals_for_on_court: goalsFor,
    goals_against_on_court: goalsAgainst,
    on_court_goal_difference: diff,
    on_court_goal_difference_per_10min: mp ? (diff / mp) * 10 : null,
  };
}
