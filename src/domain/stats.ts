import type { Match, MatchEvent, Player, Stint, Team } from "./types";
import { FIELD_ZONES, GOAL_ZONES } from "./zones";
import { dash, pct, reliabilityLabel, saveRate, shotTotals } from "./formulas";
import { minutesPlayed, onCourtGoalBalance } from "./minutes";
import { fieldIIJ, goalkeeperScore } from "./iij";

export function shotEvents(events: MatchEvent[]) {
  return events.filter((e) => e.type === "SHOT" && e.shot);
}

export function teamShots(events: MatchEvent[], teamId: string) {
  return shotEvents(events).filter((e) => e.shot!.attacking_team_id === teamId);
}

export function playerShots(events: MatchEvent[], playerId: string) {
  return shotEvents(events).filter((e) => e.shot!.shooter_id === playerId);
}

export function matrixZXB(shots: MatchEvent[]) {
  const cells: Record<string, { shots: number; onTarget: number; goals: number; saves: number }> = {};
  for (const z of FIELD_ZONES) {
    for (const b of GOAL_ZONES) {
      cells[`${z}-${b}`] = { shots: 0, onTarget: 0, goals: 0, saves: 0 };
    }
  }
  for (const e of shots) {
    const s = e.shot!;
    if (!s.goal_target_zone) continue;
    const key = `${s.field_shot_zone}-${s.goal_target_zone}`;
    if (!cells[key]) continue;
    cells[key].shots += 1;
    if (s.shot_result === "GOAL" || s.shot_result === "SAVED") cells[key].onTarget += 1;
    if (s.shot_result === "GOAL") cells[key].goals += 1;
    if (s.shot_result === "SAVED") cells[key].saves += 1;
  }
  return cells;
}

export function fieldHeat(shots: MatchEvent[]) {
  return FIELD_ZONES.map((z) => {
    const zs = shots.filter((e) => e.shot!.field_shot_zone === z);
    const t = shotTotals(zs.map((e) => e.shot!));
    return { zone: z, volume: t.total_shots, goals: t.goals, efficiency: t.shot_efficiency, on_target: t.goals + t.saved };
  });
}

export function goalHeat(shots: MatchEvent[]) {
  const onTarget = shots.filter(
    (e) => e.shot!.goal_target_zone && (e.shot!.shot_result === "GOAL" || e.shot!.shot_result === "SAVED")
  );
  return GOAL_ZONES.map((b) => {
    const zs = onTarget.filter((e) => e.shot!.goal_target_zone === b);
    const goals = zs.filter((e) => e.shot!.shot_result === "GOAL").length;
    return { zone: b, on_target: zs.length, goals, usage: pct(zs.length, onTarget.length), efficiency: pct(goals, zs.length) };
  });
}

export function teamBoxScore(events: MatchEvent[], teamId: string) {
  const shots = teamShots(events, teamId);
  const totals = shotTotals(shots.map((e) => e.shot!));
  const saves = events.filter((e) => e.type === "GOALKEEPER_SAVE" && e.team_id === teamId).length;
  const goalsConceded = shotEvents(events).filter(
    (e) => e.shot!.defending_team_id === teamId && e.shot!.shot_result === "GOAL"
  ).length;
  const emptyNet = events.filter(
    (e) =>
      e.shot?.shot_result === "GOAL" &&
      e.shot.defending_team_id === teamId &&
      (e.context.numerical_context_opponent === "EMPTY_GOAL_7V6" ||
        e.context.numerical_context === "EMPTY_GOAL_7V6")
  ).length;
  const count = (type: string) => events.filter((e) => e.team_id === teamId && e.type === type).length;
  return {
    goals_scored: totals.goals,
    goals_conceded: goalsConceded,
    goal_difference: totals.goals - goalsConceded,
    shots: totals.total_shots,
    shots_on_target: totals.goals + totals.saved,
    shot_efficiency: totals.shot_efficiency,
    saves,
    save_rate: saveRate(saves, goalsConceded),
    assists: count("ASSIST"),
    pre_assists: count("PRE_ASSIST"),
    turnovers: count("TURNOVER") + count("PASSIVE_TURNOVER"),
    reception_errors: count("RECEPTION_ERROR"),
    steals: count("STEAL"),
    interceptions: count("INTERCEPTION"),
    recoveries: count("RECOVERY"),
    defensive_blocks: count("DEFENSIVE_BLOCK"),
    two_min_received: count("TWO_MIN_RECEIVED"),
    two_min_drawn: count("TWO_MIN_DRAWN"),
    counterattack_goals: shots.filter((e) => e.shot!.attack_context === "COUNTER" && e.shot!.shot_result === "GOAL").length,
    second_wave_goals: shots.filter((e) => e.shot!.attack_context === "SECOND_WAVE" && e.shot!.shot_result === "GOAL").length,
    passive_warnings: count("PASSIVE_WARNING"),
    passive_turnovers: count("PASSIVE_TURNOVER"),
    seven_vs_six_goals: shots.filter(
      (e) => e.context.numerical_context === "EMPTY_GOAL_7V6" && e.shot!.shot_result === "GOAL"
    ).length,
    empty_net_goals_conceded: emptyNet,
  };
}

export function playerScorecard(player: Player, events: MatchEvent[], stints: Stint[], match: Match) {
  const mine = events.filter((e) => e.player_id === player.player_id);
  const shots = playerShots(events, player.player_id);
  const totals = shotTotals(shots.map((e) => e.shot!));
  const mp = minutesPlayed(stints.filter((s) => s.player_id === player.player_id));
  const balance = onCourtGoalBalance(events, stints, player.player_id, player.team_id);
  const iij = player.is_goalkeeper ? null : fieldIIJ(events, player.player_id, stints);
  const gk = player.is_goalkeeper ? goalkeeperScore(events, player.player_id) : null;
  const reliability = reliabilityLabel(mp, mine.length);
  const topOrigin = fieldHeat(shots).sort((a, b) => b.volume - a.volume)[0];
  const narrative = `Em ${dash(mp, 1)} minutos, o atleta apresentou maior volume de remate em ${
    topOrigin?.zone ?? "—"
  }, com eficácia de ${dash(totals.shot_efficiency)}%. O impacto por 10 min foi ${
    iij ? dash(iij.IIJ_per_10min) : "n/a (GR)"
  }. Em situação de ${mine[0]?.context.numerical_context ?? "EVEN_6V6"}, registou ${mine.length} ações. A leitura tem fiabilidade ${reliability}, baseada em ${mine.length} ações e deve ser confirmada pelos clips associados.`;
  return {
    player,
    minutes: mp,
    usage: match.regulation_duration_seconds
      ? (mp / ((match.regulation_duration_seconds + match.extra_time_seconds) / 60)) * 100
      : 0,
    actions: mine.length,
    actions_per_10min: mp ? (mine.length / mp) * 10 : null,
    shots: totals,
    heat_field: fieldHeat(shots),
    heat_goal: goalHeat(shots),
    assists: mine.filter((e) => e.type === "ASSIST").length,
    pre_assists: mine.filter((e) => e.type === "PRE_ASSIST").length,
    turnovers: mine.filter((e) => e.type === "TURNOVER" || e.type === "PASSIVE_TURNOVER").length,
    steals: mine.filter((e) => e.type === "STEAL").length,
    interceptions: mine.filter((e) => e.type === "INTERCEPTION").length,
    recoveries: mine.filter((e) => e.type === "RECOVERY").length,
    blocks: mine.filter((e) => e.type === "DEFENSIVE_BLOCK").length,
    two_min_received: mine.filter((e) => e.type === "TWO_MIN_RECEIVED").length,
    two_min_drawn: mine.filter((e) => e.type === "TWO_MIN_DRAWN").length,
    iij,
    gk,
    balance,
    reliability,
    narrative,
    note_balance: "Indicador coletivo e contextual; não atribui causalidade exclusiva ao atleta.",
  };
}

export function formatBox(box: ReturnType<typeof teamBoxScore>) {
  return { ...box, shot_efficiency_label: dash(box.shot_efficiency), save_rate_label: dash(box.save_rate) };
}

export type Dataset = {
  match: Match;
  teams: Team[];
  players: Player[];
  stints: Stint[];
  events: MatchEvent[];
};
