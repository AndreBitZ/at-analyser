import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { createClient } from "@libsql/client";
import { migrate } from "./db.js";

export const TREE = [
  "db",
  "logos",
  "fotos/clubes",
  "fotos/jogadoras",
  "fotos/equipas",
  "videos",
  "clips",
  "exportacoes",
];

let root = null;
let db = null;

export function getWorkspace() {
  return { root, ready: Boolean(db) };
}

export function getDb() {
  return db;
}

export async function openWorkspace(userPath) {
  const resolved = resolve(String(userPath || "").trim());
  if (!resolved || resolved.length < 2) throw new Error("Indica o caminho da pasta");
  mkdirSync(resolved, { recursive: true });
  for (const dir of TREE) mkdirSync(join(resolved, dir), { recursive: true });
  const dbFile = join(resolved, "db", "at-analyser.db");
  const client = createClient({ url: `file:${dbFile}` });
  await migrate(client);
  writeFileSync(
    join(resolved, "LEIAME.txt"),
    [
      "AT Analyser — pasta de dados",
      "",
      "db/              base SQLite",
      "logos/           emblemas",
      "fotos/clubes/    fotos de clube",
      "fotos/jogadoras/ retratos",
      "fotos/equipas/   fotos de equipa",
      "videos/          jogos completos",
      "clips/           cortes",
      "exportacoes/     PDF / JSON",
    ].join("\n"),
    "utf8",
  );
  root = resolved;
  db = client;
  return { root, dbFile, folders: TREE };
}

export function mediaPath(...parts) {
  if (!root) throw new Error("Pasta ainda não escolhida");
  return join(root, ...parts);
}

export function workspaceExists(userPath) {
  const resolved = resolve(String(userPath || "").trim());
  return existsSync(join(resolved, "db", "at-analyser.db"));
}
