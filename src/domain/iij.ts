import { DEFAULT_IIJ_WEIGHTS, type MatchEvent, type Stint } from "./types";
import { minutesPlayed } from "./minutes";

export function fieldIIJ(events: MatchEvent[], playerId: string, stints: Stint[], weights = DEFAULT_IIJ_WEIGHTS) {
  const mine = events.filter((e) => e.player_id === playerId);
  let raw = 100;
  for (const e of mine) {
    if (e.type === "SHOT" && e.shot) {
      if (e.shot.shot_result === "GOAL") raw += weights.GOAL ?? 0;
      else if (e.shot.shot_result === "MISSED") raw += weights.MISSED_SHOT ?? 0;
      else if (e.shot.shot_result === "BLOCKED") raw += weights.BLOCKED_SHOT ?? 0;
      continue;
    }
    const w = weights[e.type];
    if (typeof w === "number") raw += w;
  }
  const mp = minutesPlayed(stints.filter((s) => s.player_id === playerId));
  return {
    IIJ_raw: raw,
    IIJ_per_10min: mp ? ((raw - 100) / mp) * 10 : null,
    minutes: mp,
  };
}

export function goalkeeperScore(events: MatchEvent[], playerId: string) {
  const mine = events.filter((e) => e.player_id === playerId);
  const saves = mine.filter((e) => e.type === "GOALKEEPER_SAVE").length;
  const distOk = mine.filter((e) => e.type === "GOALKEEPER_DISTRIBUTION_SUCCESS").length;
  const distErr = mine.filter((e) => e.type === "GOALKEEPER_DISTRIBUTION_ERROR").length;
  const assists = mine.filter((e) => e.type === "GOALKEEPER_ASSIST").length;
  const sevenMeterSaves = mine.filter(
    (e) => e.type === "GOALKEEPER_SAVE" && e.shot?.shot_type === "7M"
  ).length;
  const counterSaves = mine.filter(
    (e) => e.type === "GOALKEEPER_SAVE" && e.shot?.attack_context === "COUNTER"
  ).length;
  return {
    saves,
    seven_meter_saves: sevenMeterSaves,
    counter_saves: counterSaves,
    assists,
    distributions_success: distOk,
    distributions_error: distErr,
    score: 100 + saves * 2 + sevenMeterSaves * 1.5 + counterSaves * 1 + assists * 2 + distOk * 0.5 - distErr * 1.5,
  };
}
