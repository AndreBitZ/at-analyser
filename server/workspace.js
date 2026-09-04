import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { createDb, isTurso, migrate } from "./db.js";

export const TREE = [
  "db", "logos", "fotos/clubes", "fotos/jogadoras", "fotos/equipas", "videos", "clips", "exportacoes",
];

let root = null;
let db = null;

export function getWorkspace() {
  return {
    root,
    ready: Boolean(db),
    mode: isTurso() ? "turso" : root ? "local-sqlite" : "none",
  };
}

export function getDb() {
  return db;
}

export async function openCloud() {
  if (!isTurso()) throw new Error("Faltam TURSO_DATABASE_URL e TURSO_AUTH_TOKEN no Vercel");
  const client = createDb();
  await migrate(client);
  root = "turso";
  db = client;
  return { root: "turso", mode: "turso" };
}

export async function ensureDb() {
  if (db) return db;
  if (isTurso()) {
    await openCloud();
    return db;
  }
  return null;
}

export async function openWorkspace(userPath) {
  if (isTurso() || userPath === "turso" || userPath === "cloud") return openCloud();
  const resolved = resolve(String(userPath || "").trim());
  if (!resolved || resolved.length < 2) throw new Error("Indica o caminho da pasta");
  mkdirSync(resolved, { recursive: true });
  for (const dir of TREE) mkdirSync(join(resolved, dir), { recursive: true });
  const dbFile = join(resolved, "db", "at-analyser.db");
  const { createClient } = await import("@libsql/client");
  const client = createClient({ url: `file:${dbFile}` });
  await migrate(client);
  writeFileSync(join(resolved, "LEIAME.txt"), "AT Analyser — pasta de dados\n", "utf8");
  root = resolved;
  db = client;
  return { root, dbFile, folders: TREE, mode: "local-sqlite" };
}

export function mediaPath(...parts) {
  if (!root || root === "turso") throw new Error("Fotos/vídeos no Vercel: usa URLs. Pasta só no PC.");
  return join(root, ...parts);
}

export function workspaceExists(userPath) {
  if (isTurso()) return true;
  const resolved = resolve(String(userPath || "").trim());
  return existsSync(join(resolved, "db", "at-analyser.db"));
}
