PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS clubs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS age_groups (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT 'F',
  UNIQUE (club_id, code)
);

CREATE TABLE IF NOT EXISTS seasons (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL UNIQUE,
  start_date TEXT,
  end_date TEXT
);

CREATE TABLE IF NOT EXISTS championships (
  id TEXT PRIMARY KEY,
  season_id TEXT NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  age_group_id TEXT REFERENCES age_groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  organizer TEXT
);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  age_group_id TEXT NOT NULL REFERENCES age_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT
);

CREATE TABLE IF NOT EXISTS championship_teams (
  championship_id TEXT NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  PRIMARY KEY (championship_id, team_id)
);

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  shirt_number INTEGER,
  birth_year INTEGER,
  primary_position TEXT NOT NULL DEFAULT 'UNKNOWN',
  is_goalkeeper INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS player_age_groups (
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  age_group_id TEXT NOT NULL REFERENCES age_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (player_id, age_group_id)
);

CREATE TABLE IF NOT EXISTS player_team_season (
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  season_id TEXT NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  PRIMARY KEY (player_id, team_id, season_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  championship_id TEXT REFERENCES championships(id) ON DELETE SET NULL,
  season_id TEXT REFERENCES seasons(id) ON DELETE SET NULL,
  home_team_id TEXT NOT NULL REFERENCES teams(id),
  away_team_id TEXT NOT NULL REFERENCES teams(id),
  kickoff_iso TEXT,
  venue TEXT,
  regulation_duration_seconds INTEGER NOT NULL DEFAULT 3600,
  extra_time_seconds INTEGER NOT NULL DEFAULT 0,
  video_url TEXT,
  status TEXT NOT NULL DEFAULT 'SCHEDULED'
);

CREATE TABLE IF NOT EXISTS stints (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES players(id),
  team_id TEXT NOT NULL REFERENCES teams(id),
  position_played TEXT NOT NULL,
  start_timestamp REAL NOT NULL,
  end_timestamp REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS suspensions (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES teams(id),
  player_id TEXT NOT NULL REFERENCES players(id),
  start_timestamp REAL NOT NULL,
  end_timestamp REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  timestamp_seconds REAL NOT NULL,
  team_id TEXT NOT NULL REFERENCES teams(id),
  player_id TEXT REFERENCES players(id),
  type TEXT NOT NULL,
  related_shot_event_id TEXT,
  shot_json TEXT,
  context_json TEXT NOT NULL,
  clip_url TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_match ON events(match_id, timestamp_seconds);
CREATE INDEX IF NOT EXISTS idx_pag_player ON player_age_groups(player_id);
CREATE INDEX IF NOT EXISTS idx_pag_group ON player_age_groups(age_group_id);
