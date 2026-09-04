import { homedir } from "node:os";
import { join } from "node:path";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const dir = join(homedir(), "Library", "Application Support", "AT-Analyser");
const file = join(dir, "prefs.json");

export function readPrefs() {
  try { return JSON.parse(readFileSync(file, "utf8")); } catch { return {}; }
}

export function writePrefs(patch) {
  mkdirSync(dir, { recursive: true });
  const next = { ...readPrefs(), ...patch };
  writeFileSync(file, JSON.stringify(next, null, 2));
  return next;
}

export function lastFolder() {
  return readPrefs().lastFolder || null;
}
