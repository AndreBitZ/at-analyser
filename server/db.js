import { createClient } from "@libsql/client";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(here, "../db/schema.sql");

export function sqlitePath() {
  return resolve(process.env.AT_ANALYSER_DB || resolve(here, "../data/at-analyser.db"));
}

export function createDb() {
  const file = sqlitePath();
  mkdirSync(dirname(file), { recursive: true });
  return createClient({ url: `file:${file}` });
}

export async function migrate(db) {
  const sql = readFileSync(schemaPath, "utf8");
  for (const stmt of sql.split(";").map((s) => s.trim()).filter((s) => s && !s.startsWith("--"))) {
    await db.execute(stmt);
  }
  try { await db.execute("ALTER TABLE player_team_season ADD COLUMN left_at TEXT"); } catch { /* already there */ }
}

export function id(prefix) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}
export function row(result) {
  return result.rows[0] ?? null;
}
export function rows(result) {
  return result.rows;
}
