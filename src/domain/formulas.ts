export function pct(num: number, den: number): number | null {
  if (!den) return null;
  return (num / den) * 100;
}

export function dash(value: number | null, digits = 1): string {
  if (value === null || Number.isNaN(value)) return "—";
  return value.toFixed(digits);
}

export function shotTotals(shots: { shot_result: string }[]) {
  const goals = shots.filter((s) => s.shot_result === "GOAL").length;
  const saved = shots.filter((s) => s.shot_result === "SAVED").length;
  const missed = shots.filter((s) => s.shot_result === "MISSED").length;
  const post = shots.filter((s) => s.shot_result === "POST").length;
  const blocked = shots.filter((s) => s.shot_result === "BLOCKED").length;
  const total = goals + saved + missed + post + blocked;
  return {
    goals,
    saved,
    missed,
    post,
    blocked,
    total_shots: total,
    shot_efficiency: pct(goals, total),
    on_target_rate: pct(goals + saved, total),
    on_target_conversion: pct(goals, goals + saved),
    blocked_shot_rate: pct(blocked, total),
    technical_miss_rate: pct(missed + post, total),
  };
}

export function zoneVolume(shotsFromZone: number, total: number) {
  return pct(shotsFromZone, total);
}

export function zoneEfficiency(goalsFromZone: number, shotsFromZone: number) {
  return pct(goalsFromZone, shotsFromZone);
}

export function goalTargetUsage(onTargetToZone: number, allOnTargetWithZone: number) {
  return pct(onTargetToZone, allOnTargetWithZone);
}

export function goalTargetEfficiency(goalsToZone: number, onTargetToZone: number) {
  return pct(goalsToZone, onTargetToZone);
}

export function originDestinationConversion(goals: number, onTarget: number) {
  return pct(goals, onTarget);
}

export function saveRate(saves: number, goalsConceded: number) {
  return pct(saves, saves + goalsConceded);
}

export function shotsPer10(count: number, minutesInContext: number) {
  if (!minutesInContext) return null;
  return (count / minutesInContext) * 10;
}

export function reliabilityLabel(minutes: number, actions: number): string {
  if (minutes < 10 || actions < 8) return "baixa";
  if (minutes < 25 || actions < 20) return "moderada";
  return "alta";
}
