import type { Match, MatchEvent, Player, Stint, Team } from "../domain/types";
import { buildEventContext } from "../domain/context";

export const teams: Team[] = [
  { team_id: "home", name: "AT Sub-14" },
  { team_id: "away", name: "Visitante" },
];

export const match: Match = {
  match_id: "m1",
  home_team_id: "home",
  away_team_id: "away",
  competition: "Demo",
  regulation_duration_seconds: 3600,
  extra_time_seconds: 0,
};

export const players: Player[] = [
  { player_id: "h1", team_id: "home", name: "Inês L.", number: 9, primary_position: "LB", is_goalkeeper: false },
  { player_id: "h2", team_id: "home", name: "Marta S.", number: 5, primary_position: "CB", is_goalkeeper: false },
  { player_id: "h3", team_id: "home", name: "Beatriz P.", number: 3, primary_position: "RW", is_goalkeeper: false },
  { player_id: "h4", team_id: "home", name: "Ana G.", number: 2, primary_position: "PV", is_goalkeeper: false },
  { player_id: "h5", team_id: "home", name: "Sofia R.", number: 7, primary_position: "LW", is_goalkeeper: false },
  { player_id: "hgk", team_id: "home", name: "Clara M.", number: 1, primary_position: "GK", is_goalkeeper: true },
  { player_id: "a1", team_id: "away", name: "Jogadora A1", number: 10, primary_position: "CB", is_goalkeeper: false },
  { player_id: "agk", team_id: "away", name: "GR Visitante", number: 16, primary_position: "GK", is_goalkeeper: true },
];

export const stints: Stint[] = players.map((p, i) => ({
  stint_id: `s${i}`,
  match_id: "m1",
  player_id: p.player_id,
  team_id: p.team_id,
  position_played: p.primary_position,
  start_timestamp: 0,
  end_timestamp: 3600,
}));

function ev(
  id: string,
  ts: number,
  team: string,
  type: MatchEvent["type"],
  extra: Partial<MatchEvent> & {
    scoreFor: number;
    scoreAgainst: number;
    numerical?: MatchEvent["context"]["numerical_context"];
    passive?: MatchEvent["context"]["passive_context"];
  }
): MatchEvent {
  const ctx = buildEventContext({
    match,
    teamId: team,
    timestamp: ts,
    scoreFor: extra.scoreFor,
    scoreAgainst: extra.scoreAgainst,
    numerical: extra.numerical ?? "EVEN_6V6",
    numericalOpp: extra.numerical === "POWERPLAY_6V5" ? "SHORTHANDED_5V6" : "EVEN_6V6",
    passive: extra.passive ?? "NO_PASSIVE",
  });
  const { scoreFor, scoreAgainst, numerical, passive, ...rest } = extra;
  return { event_id: id, match_id: "m1", timestamp_seconds: ts, team_id: team, type, context: ctx, ...rest };
}

export const events: MatchEvent[] = [
  ev("e1", 95, "home", "SHOT", {
    scoreFor: 0, scoreAgainst: 0, player_id: "h1",
    shot: { attacking_team_id: "home", defending_team_id: "away", shooter_id: "h1", goalkeeper_id: "agk", field_shot_zone: "Z6", goal_target_zone: "B1", shot_result: "SAVED", shot_type: "JUMP", attack_context: "POSITIONAL" },
  }),
  ev("e1s", 95, "away", "GOALKEEPER_SAVE", {
    scoreFor: 0, scoreAgainst: 0, player_id: "agk", related_shot_event_id: "e1",
    shot: { attacking_team_id: "home", defending_team_id: "away", shooter_id: "h1", goalkeeper_id: "agk", field_shot_zone: "Z6", goal_target_zone: "B1", shot_result: "SAVED" },
  }),
  ev("e2", 188, "home", "ASSIST", { scoreFor: 0, scoreAgainst: 0, player_id: "h2" }),
  ev("e3", 190, "home", "SHOT", {
    scoreFor: 0, scoreAgainst: 0, player_id: "h4",
    shot: { attacking_team_id: "home", defending_team_id: "away", shooter_id: "h4", goalkeeper_id: "agk", field_shot_zone: "Z3", goal_target_zone: "B7", shot_result: "GOAL", shot_type: "PIVOT", attack_context: "POSITIONAL" },
  }),
  ev("e4", 410, "away", "SHOT", {
    scoreFor: 0, scoreAgainst: 1, player_id: "a1",
    shot: { attacking_team_id: "away", defending_team_id: "home", shooter_id: "a1", goalkeeper_id: "hgk", field_shot_zone: "Z7", goal_target_zone: "B3", shot_result: "GOAL", shot_type: "JUMP" },
  }),
  ev("e5", 780, "home", "STEAL", { scoreFor: 1, scoreAgainst: 1, player_id: "h5" }),
  ev("e6", 788, "home", "SHOT", {
    scoreFor: 1, scoreAgainst: 1, player_id: "h3",
    shot: { attacking_team_id: "home", defending_team_id: "away", shooter_id: "h3", goalkeeper_id: "agk", field_shot_zone: "Z5", goal_target_zone: "B9", shot_result: "GOAL", shot_type: "WING", attack_context: "COUNTER" },
  }),
  ev("e7", 1100, "home", "TURNOVER", { scoreFor: 2, scoreAgainst: 1, player_id: "h1" }),
  ev("e8", 1488, "home", "SHOT", {
    scoreFor: 2, scoreAgainst: 1, player_id: "h1", numerical: "POWERPLAY_6V5",
    shot: { attacking_team_id: "home", defending_team_id: "away", shooter_id: "h1", goalkeeper_id: "agk", field_shot_zone: "Z7", goal_target_zone: "B5", shot_result: "GOAL", shot_type: "JUMP" },
  }),
  ev("e10", 2100, "home", "PASSIVE_WARNING", { scoreFor: 3, scoreAgainst: 1, player_id: "h2" }),
  ev("e11", 2140, "home", "SHOT", {
    scoreFor: 3, scoreAgainst: 1, player_id: "h2", passive: "PASSIVE_PASSES_3_4",
    shot: { attacking_team_id: "home", defending_team_id: "away", shooter_id: "h2", goalkeeper_id: "agk", field_shot_zone: "Z8", goal_target_zone: null, shot_result: "MISSED", shot_type: "JUMP" },
  }),
  ev("e12", 2680, "away", "SHOT", {
    scoreFor: 2, scoreAgainst: 3, player_id: "a1",
    shot: { attacking_team_id: "away", defending_team_id: "home", shooter_id: "a1", goalkeeper_id: "hgk", field_shot_zone: "Z2", goal_target_zone: "B4", shot_result: "SAVED", shot_type: "PIVOT" },
  }),
  ev("e12s", 2680, "home", "GOALKEEPER_SAVE", {
    scoreFor: 3, scoreAgainst: 2, player_id: "hgk", related_shot_event_id: "e12",
    shot: { attacking_team_id: "away", defending_team_id: "home", shooter_id: "a1", goalkeeper_id: "hgk", field_shot_zone: "Z2", goal_target_zone: "B4", shot_result: "SAVED" },
  }),
  ev("e13", 3120, "home", "SHOT", {
    scoreFor: 3, scoreAgainst: 2, player_id: "h2",
    shot: { attacking_team_id: "home", defending_team_id: "away", shooter_id: "h2", goalkeeper_id: "agk", field_shot_zone: "Z7", goal_target_zone: "B2", shot_result: "GOAL", shot_type: "JUMP" },
  }),
  ev("e14", 3400, "away", "SHOT", {
    scoreFor: 2, scoreAgainst: 4, player_id: "a1",
    shot: { attacking_team_id: "away", defending_team_id: "home", shooter_id: "a1", goalkeeper_id: "hgk", field_shot_zone: "Z9", goal_target_zone: null, shot_result: "BLOCKED", attack_context: "TRANSITION" },
  }),
  ev("e15", 3401, "home", "DEFENSIVE_BLOCK", { scoreFor: 4, scoreAgainst: 2, player_id: "h4" }),
];

export const sampleDataset = { match, teams, players, stints, events };
