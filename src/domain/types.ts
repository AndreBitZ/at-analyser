export type Id = string;

export type ShotResult = "GOAL" | "SAVED" | "MISSED" | "POST" | "BLOCKED";
export type GameState = "LEADING" | "DRAWING" | "TRAILING";
export type HomeAway = "HOME" | "AWAY" | "NEUTRAL";

export type NumericalContext =
  | "EVEN_6V6"
  | "POWERPLAY_6V5"
  | "POWERPLAY_6V4"
  | "SHORTHANDED_5V6"
  | "SHORTHANDED_4V6"
  | "EMPTY_GOAL_7V6"
  | "EMPTY_GOAL_7V5"
  | "OTHER"
  | "UNKNOWN";

export type PassiveContext =
  | "NO_PASSIVE"
  | "PASSIVE_PASSES_0_2"
  | "PASSIVE_PASSES_3_4"
  | "PASSIVE_PASSES_5_6"
  | "PASSIVE_TURNOVER"
  | "UNKNOWN";

export type FieldEventType =
  | "SHOT"
  | "GOAL"
  | "ASSIST"
  | "PRE_ASSIST"
  | "TURNOVER"
  | "RECEPTION_ERROR"
  | "OFFENSIVE_FOUL"
  | "STEAL"
  | "INTERCEPTION"
  | "RECOVERY"
  | "DEFENSIVE_BLOCK"
  | "SEVEN_METER_WON"
  | "SEVEN_METER_CONCEDED"
  | "TWO_MIN_RECEIVED"
  | "TWO_MIN_DRAWN"
  | "PASSIVE_WARNING"
  | "PASSIVE_TURNOVER"
  | "SUBSTITUTION_IN"
  | "SUBSTITUTION_OUT"
  | "ERROR_LEADING_TO_OPPONENT_COUNTERATTACK_OR_GOAL";

export type GoalkeeperEventType =
  | "GOALKEEPER_SAVE"
  | "GOALKEEPER_DISTRIBUTION_SUCCESS"
  | "GOALKEEPER_DISTRIBUTION_ERROR"
  | "GOALKEEPER_ASSIST";

export type EventType = FieldEventType | GoalkeeperEventType;

export type FieldShotZone = "Z1" | "Z2" | "Z3" | "Z4" | "Z5" | "Z6" | "Z7" | "Z8" | "Z9";
export type GoalTargetZone = "B1" | "B2" | "B3" | "B4" | "B5" | "B6" | "B7" | "B8" | "B9";

export type PositionPlayed =
  | "LW"
  | "LB"
  | "CB"
  | "RB"
  | "RW"
  | "PV"
  | "GK"
  | "UNKNOWN";

export interface Team {
  team_id: Id;
  name: string;
}

export interface Player {
  player_id: Id;
  team_id: Id;
  name: string;
  number?: number;
  primary_position: PositionPlayed;
  is_goalkeeper: boolean;
}

export interface Match {
  match_id: Id;
  home_team_id: Id;
  away_team_id: Id;
  competition?: string;
  kickoff_iso?: string;
  regulation_duration_seconds: number;
  extra_time_seconds: number;
  video_url?: string;
}

export interface Stint {
  stint_id: Id;
  match_id: Id;
  player_id: Id;
  team_id: Id;
  position_played: PositionPlayed;
  start_timestamp: number;
  end_timestamp: number;
}

export interface Suspension {
  suspension_id: Id;
  match_id: Id;
  team_id: Id;
  player_id: Id;
  start_timestamp: number;
  end_timestamp: number;
}

export interface ShotPayload {
  attacking_team_id: Id;
  defending_team_id: Id;
  shooter_id: Id;
  goalkeeper_id?: Id;
  field_shot_zone: FieldShotZone;
  goal_target_zone: GoalTargetZone | null;
  shot_result: ShotResult;
  shot_type?: string;
  shot_hand?: "LEFT" | "RIGHT" | "UNKNOWN";
  attack_context?: string;
  opposition_level?: string;
}

export interface EventContext {
  score_for_before: number;
  score_against_before: number;
  score_difference_before: number;
  game_state: GameState;
  home_away: HomeAway;
  numerical_context: NumericalContext;
  numerical_context_opponent: NumericalContext;
  passive_context: PassiveContext;
  five_minute_block: string;
  five_minute_block_index: number;
}

export interface MatchEvent {
  event_id: Id;
  match_id: Id;
  timestamp_seconds: number;
  team_id: Id;
  player_id?: Id;
  type: EventType;
  shot?: ShotPayload;
  related_shot_event_id?: Id;
  context: EventContext;
  clip_url?: string;
  notes?: string;
}

export interface PassiveState {
  warning_active: boolean;
  warning_timestamp?: number;
  passes_since_warning: number;
  passes_remaining: number;
  turnover: boolean;
}

export interface DerivedFilters {
  FIRST_HALF: boolean;
  SECOND_HALF: boolean;
  LAST_15_MINUTES: boolean;
  LAST_10_MINUTES: boolean;
  LAST_5_MINUTES: boolean;
  LAST_2_MINUTES: boolean;
  CRUNCHTIME: boolean;
}

export const MAX_PASSES_AFTER_PASSIVE_WARNING = 6;

export const DEFAULT_IIJ_WEIGHTS: Record<string, number> = {
  GOAL: 3,
  ASSIST: 2,
  PRE_ASSIST: 0.75,
  STEAL: 2,
  INTERCEPTION: 2,
  RECOVERY: 1.5,
  DEFENSIVE_BLOCK: 1.5,
  SEVEN_METER_WON: 1.5,
  TWO_MIN_DRAWN: 1,
  MISSED_SHOT: -1,
  BLOCKED_SHOT: -0.75,
  TURNOVER: -2,
  OFFENSIVE_FOUL: -1.5,
  TWO_MIN_RECEIVED: -2,
  ERROR_LEADING_TO_OPPONENT_COUNTERATTACK_OR_GOAL: -3,
};
