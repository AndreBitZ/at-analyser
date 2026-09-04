const KEY = "at-analyser-db-v1";

export type Store = {
  clubs: any[];
  age_groups: any[];
  seasons: any[];
  championships: any[];
  teams: any[];
  championship_teams: any[];
  players: any[];
  matches: any[];
};

function empty(): Store {
  return {
    clubs: [],
    age_groups: [],
    seasons: [],
    championships: [],
    teams: [],
    championship_teams: [],
    players: [],
    matches: [],
  };
}

export function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...JSON.parse(raw) };
  } catch {
    return empty();
  }
}

export function save(s: Store) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
