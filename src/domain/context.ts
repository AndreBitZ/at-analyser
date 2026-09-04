import {
  MAX_PASSES_AFTER_PASSIVE_WARNING,
  type Match,
  type NumericalContext,
  type PassiveContext,
  type PassiveState,
  type Suspension,
} from "./types";
import { blockCode, fiveMinuteBlockIndex } from "./time";

export function gameState(diff: number) {
  if (diff > 0) return "LEADING" as const;
  if (diff < 0) return "TRAILING" as const;
  return "DRAWING" as const;
}

export function homeAway(teamId: string, match: Match) {
  if (teamId === match.home_team_id) return "HOME" as const;
  if (teamId === match.away_team_id) return "AWAY" as const;
  return "NEUTRAL" as const;
}

export function activeSuspensions(
  suspensions: Suspension[],
  matchId: string,
  teamId: string,
  timestamp: number
): Suspension[] {
  return suspensions.filter(
    (s) =>
      s.match_id === matchId &&
      s.team_id === teamId &&
      s.start_timestamp <= timestamp &&
      timestamp < s.end_timestamp
  );
}

export function numericalContextFromCounts(
  ownOnCourt: number,
  oppOnCourt: number,
  ownGkOnCourt: boolean,
  oppGkOnCourt: boolean
): NumericalContext {
  if (ownOnCourt === 6 && oppOnCourt === 6 && ownGkOnCourt && oppGkOnCourt) return "EVEN_6V6";
  if (ownOnCourt === 6 && oppOnCourt === 5) return "POWERPLAY_6V5";
  if (ownOnCourt === 6 && oppOnCourt === 4) return "POWERPLAY_6V4";
  if (ownOnCourt === 5 && oppOnCourt === 6) return "SHORTHANDED_5V6";
  if (ownOnCourt === 4 && oppOnCourt === 6) return "SHORTHANDED_4V6";
  if (ownOnCourt === 7 && oppOnCourt === 6 && !ownGkOnCourt) return "EMPTY_GOAL_7V6";
  if (ownOnCourt === 7 && oppOnCourt === 5 && !ownGkOnCourt) return "EMPTY_GOAL_7V5";
  if (ownOnCourt === 0 || oppOnCourt === 0) return "UNKNOWN";
  return "OTHER";
}

export function passiveContextFromState(state: PassiveState): PassiveContext {
  if (state.turnover) return "PASSIVE_TURNOVER";
  if (!state.warning_active) return "NO_PASSIVE";
  if (state.passes_since_warning <= 2) return "PASSIVE_PASSES_0_2";
  if (state.passes_since_warning <= 4) return "PASSIVE_PASSES_3_4";
  if (state.passes_since_warning <= 6) return "PASSIVE_PASSES_5_6";
  return "UNKNOWN";
}

export function applyPass(state: PassiveState): PassiveState {
  if (!state.warning_active) return state;
  const passes = state.passes_since_warning + 1;
  return {
    ...state,
    passes_since_warning: passes,
    passes_remaining: Math.max(0, MAX_PASSES_AFTER_PASSIVE_WARNING - passes),
    turnover: passes > MAX_PASSES_AFTER_PASSIVE_WARNING,
  };
}

export function startPassiveWarning(timestamp: number): PassiveState {
  return {
    warning_active: true,
    warning_timestamp: timestamp,
    passes_since_warning: 0,
    passes_remaining: MAX_PASSES_AFTER_PASSIVE_WARNING,
    turnover: false,
  };
}

export function idlePassive(): PassiveState {
  return {
    warning_active: false,
    passes_since_warning: 0,
    passes_remaining: MAX_PASSES_AFTER_PASSIVE_WARNING,
    turnover: false,
  };
}

export function buildEventContext(args: {
  match: Match;
  teamId: string;
  timestamp: number;
  scoreFor: number;
  scoreAgainst: number;
  numerical: NumericalContext;
  numericalOpp: NumericalContext;
  passive: PassiveContext;
}) {
  const diff = args.scoreFor - args.scoreAgainst;
  return {
    score_for_before: args.scoreFor,
    score_against_before: args.scoreAgainst,
    score_difference_before: diff,
    game_state: gameState(diff),
    home_away: homeAway(args.teamId, args.match),
    numerical_context: args.numerical,
    numerical_context_opponent: args.numericalOpp,
    passive_context: args.passive,
    five_minute_block: blockCode(args.timestamp, args.match.extra_time_seconds),
    five_minute_block_index: fiveMinuteBlockIndex(args.timestamp),
  };
}
