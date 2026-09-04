import { createClient } from "@libsql/client";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(here, "../db/schema.sql");

export function createDb() {
  const url = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN;
  if (url) return createClient({ url, authToken });
  const file = resolve(process.env.AT_ANALYSER_DB || resolve(here, "../data/at-analyser.db"));
  mkdirSync(dirname(file), { recursive: true });
  return createClient({ url: `file:${file}` });
}

export async function migrate(db) {
  const sql = readFileSync(schemaPath, "utf8");
  const statements = sql.split(";").map((s) => s.trim()).filter((s) => s && !s.startsWith("--"));
  for (const stmt of statements) await db.execute(stmt);
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
