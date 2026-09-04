import { cpSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { getWorkspace } from "./workspace.js";

let timer = null;
let last = null;
let lastError = null;

function settingsFile(root) {
  return join(root, "db", "backup-config.json");
}

export function loadSettings() {
  const { root } = getWorkspace();
  if (!root) return { dest: "", intervalMinutes: 60, enabled: false };
  try {
    return { dest: "", intervalMinutes: 60, enabled: false, ...JSON.parse(readFileSync(settingsFile(root), "utf8")) };
  } catch {
    return { dest: "", intervalMinutes: 60, enabled: false };
  }
}

export function saveSettings(next) {
  const { root } = getWorkspace();
  if (!root) throw new Error("Abre a pasta de dados primeiro");
  const cfg = {
    dest: String(next.dest || "").trim(),
    intervalMinutes: Math.max(5, Number(next.intervalMinutes) || 60),
    enabled: Boolean(next.enabled),
  };
  mkdirSync(join(root, "db"), { recursive: true });
  writeFileSync(settingsFile(root), JSON.stringify(cfg, null, 2));
  armTimer();
  return cfg;
}

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

export function runBackup() {
  const { root } = getWorkspace();
  if (!root) throw new Error("Pasta de dados não aberta");
  const cfg = loadSettings();
  const destRoot = cfg.dest || join(root, "exportacoes", "backups");
  mkdirSync(destRoot, { recursive: true });
  const target = join(destRoot, `AT-Analyser-${stamp()}`);
  mkdirSync(target, { recursive: true });
  const skip = join("exportacoes", "backups");
  cpSync(root, target, {
    recursive: true,
    filter: (src) => !src.includes(skip) && !src.endsWith("-wal") && !src.endsWith("-shm"),
  });
  last = { at: new Date().toISOString(), target };
  lastError = null;
  prune(destRoot, 20);
  return last;
}

function prune(destRoot, keep) {
  try {
    const dirs = readdirSync(destRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.startsWith("AT-Analyser-"))
      .map((d) => d.name)
      .sort();
    while (dirs.length > keep) {
      const old = dirs.shift();
      rmSync(join(destRoot, old), { recursive: true, force: true });
    }
  } catch {
    /* ignore */
  }
}

export function status() {
  return { ...loadSettings(), last, lastError };
}

export function armTimer() {
  if (timer) clearInterval(timer);
  timer = null;
  const cfg = loadSettings();
  if (!cfg.enabled) return;
  timer = setInterval(() => {
    try { runBackup(); } catch (e) { lastError = String(e.message || e); }
  }, cfg.intervalMinutes * 60 * 1000);
}
