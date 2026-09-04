import { writeFileSync } from "node:fs";
import { extname } from "node:path";
import { id, row, rows } from "./db.js";
import { getWorkspace, openWorkspace, mediaPath } from "./workspace.js";
import { armTimer, loadSettings, runBackup, saveSettings, status } from "./backup.js";

async function json(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function send(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(body));
}

export async function handleApi(db, req, res) {
  if (req.method === "OPTIONS") { send(res, 204, {}); return; }
  const url = new URL(req.url, "http://local");
  const path = url.pathname.replace(/^\/api/, "") || "/";
  const method = req.method;
  const parts = path.split("/").filter(Boolean);
  try {
    if (method === "GET" && path === "/health") {
      const ws = getWorkspace();
      send(res, 200, { ok: true, mode: "local-sqlite", ready: ws.ready, root: ws.root }); return;
    }
    if (method === "GET" && path === "/workspace") { send(res, 200, getWorkspace()); return; }
    if (method === "POST" && path === "/workspace") {
      const b = await json(req);
      const opened = await openWorkspace(b.root);
      armTimer();
      send(res, 200, opened); return;
    }
    if (method === "GET" && path === "/backup") { send(res, 200, status()); return; }
    if (method === "POST" && path === "/backup") {
      const b = await json(req);
      send(res, 200, saveSettings(b)); return;
    }
    if (method === "POST" && path === "/backup/run") {
      send(res, 200, runBackup()); return;
    }
    if (method === "POST" && path === "/media") {
      if (!getWorkspace().ready) { send(res, 409, { error: "Escolhe a pasta de dados primeiro" }); return; }
      const b = await json(req);
      const folder = String(b.folder || "logos").replace(/\.\./g, "");
      const filename = String(b.filename || `ficheiro${Date.now()}`).replace(/[/\\]/g, "_");
      writeFileSync(mediaPath(folder, filename), Buffer.from(b.base64 || "", "base64"));
      send(res, 201, { path: `${folder}/${filename}`, ext: extname(filename) }); return;
    }
    if (!db) { send(res, 409, { error: "Escolhe a pasta de dados no ecrã inicial." }); return; }
    if (method === "GET" && path === "/export") {
      const dump = {};
      for (const table of ["clubs","age_groups","seasons","championships","teams","championship_teams","players","player_age_groups","player_team_season","matches"]) {
        dump[table] = rows(await db.execute(`SELECT * FROM ${table}`));
      }
      send(res, 200, dump); return;
    }
    if (path === "/clubs" && method === "GET") { send(res, 200, rows(await db.execute("SELECT * FROM clubs ORDER BY name"))); return; }
    if (path === "/clubs" && method === "POST") {
      const b = await json(req); const clubId = b.id || id("club");
      await db.execute({ sql: "INSERT INTO clubs (id, name, city) VALUES (?, ?, ?)", args: [clubId, b.name, b.city ?? null] });
      send(res, 201, row(await db.execute({ sql: "SELECT * FROM clubs WHERE id = ?", args: [clubId] }))); return;
    }
    if (path === "/age-groups" && method === "GET") {
      const clubId = url.searchParams.get("club_id");
      send(res, 200, rows(await db.execute(clubId ? { sql: "SELECT * FROM age_groups WHERE club_id = ? ORDER BY code", args: [clubId] } : { sql: "SELECT * FROM age_groups ORDER BY code", args: [] }))); return;
    }
    if (path === "/age-groups" && method === "POST") {
      const b = await json(req); const agId = b.id || id("ag");
      await db.execute({ sql: "INSERT INTO age_groups (id, club_id, code, name, gender) VALUES (?, ?, ?, ?, ?)", args: [agId, b.club_id, b.code, b.name, b.gender ?? "F"] });
      send(res, 201, { id: agId }); return;
    }
    if (path === "/seasons" && method === "GET") { send(res, 200, rows(await db.execute("SELECT * FROM seasons ORDER BY label DESC"))); return; }
    if (path === "/seasons" && method === "POST") {
      const b = await json(req); const sid = b.id || id("szn");
      await db.execute({ sql: "INSERT INTO seasons (id, label, start_date, end_date) VALUES (?, ?, ?, ?)", args: [sid, b.label, b.start_date ?? null, b.end_date ?? null] });
      send(res, 201, { id: sid }); return;
    }
    if (path === "/championships" && method === "GET") {
      send(res, 200, rows(await db.execute(`SELECT c.*, s.label AS season_label, ag.name AS age_group_name FROM championships c JOIN seasons s ON s.id = c.season_id LEFT JOIN age_groups ag ON ag.id = c.age_group_id ORDER BY s.label DESC, c.name`))); return;
    }
    if (path === "/championships" && method === "POST") {
      const b = await json(req); const cid = b.id || id("cmp");
      await db.execute({ sql: "INSERT INTO championships (id, season_id, age_group_id, name, organizer) VALUES (?, ?, ?, ?, ?)", args: [cid, b.season_id, b.age_group_id ?? null, b.name, b.organizer ?? null] });
      send(res, 201, { id: cid }); return;
    }
    if (path === "/teams" && method === "GET") {
      send(res, 200, rows(await db.execute(`SELECT t.*, c.name AS club_name, ag.code AS age_group_code FROM teams t JOIN clubs c ON c.id = t.club_id JOIN age_groups ag ON ag.id = t.age_group_id ORDER BY t.name`))); return;
    }
    if (path === "/teams" && method === "POST") {
      const b = await json(req); const tid = b.id || id("tm");
      await db.execute({ sql: "INSERT INTO teams (id, club_id, age_group_id, name, short_name) VALUES (?, ?, ?, ?, ?)", args: [tid, b.club_id, b.age_group_id, b.name, b.short_name ?? null] });
      send(res, 201, { id: tid }); return;
    }
    if (path === "/championship-teams" && method === "POST") {
      const b = await json(req);
      await db.execute({ sql: "INSERT OR IGNORE INTO championship_teams (championship_id, team_id) VALUES (?, ?)", args: [b.championship_id, b.team_id] });
      send(res, 201, { ok: true }); return;
    }
    if (path === "/championship-teams" && method === "GET") {
      const championshipId = url.searchParams.get("championship_id");
      send(res, 200, rows(await db.execute({ sql: `SELECT ct.*, t.name AS team_name FROM championship_teams ct JOIN teams t ON t.id = ct.team_id WHERE (? IS NULL OR ct.championship_id = ?)`, args: [championshipId, championshipId] }))); return;
    }
    if (path === "/players" && method === "GET") {
      const players = rows(await db.execute("SELECT * FROM players ORDER BY name"));
      const links = rows(await db.execute(`SELECT pag.player_id, pag.age_group_id, ag.code, ag.name AS age_group_name FROM player_age_groups pag JOIN age_groups ag ON ag.id = pag.age_group_id`));
      send(res, 200, players.map((p) => ({ ...p, age_groups: links.filter((l) => l.player_id === p.id) }))); return;
    }
    if (path === "/players" && method === "POST") {
      const b = await json(req); const pid = b.id || id("pl");
      await db.execute({ sql: `INSERT INTO players (id, club_id, name, shirt_number, birth_year, primary_position, is_goalkeeper) VALUES (?, ?, ?, ?, ?, ?, ?)`, args: [pid, b.club_id, b.name, b.shirt_number ?? null, b.birth_year ?? null, b.primary_position ?? "UNKNOWN", b.is_goalkeeper ? 1 : 0] });
      for (const gid of (Array.isArray(b.age_group_ids) ? b.age_group_ids : [])) {
        await db.execute({ sql: "INSERT OR IGNORE INTO player_age_groups (player_id, age_group_id) VALUES (?, ?)", args: [pid, gid] });
      }
      send(res, 201, { id: pid }); return;
    }
    if (path === "/matches" && method === "GET") {
      send(res, 200, rows(await db.execute(`SELECT m.*, ht.name AS home_team_name, at.name AS away_team_name, ch.name AS championship_name, sz.label AS season_label FROM matches m JOIN teams ht ON ht.id = m.home_team_id JOIN teams at ON at.id = m.away_team_id LEFT JOIN championships ch ON ch.id = m.championship_id LEFT JOIN seasons sz ON sz.id = m.season_id ORDER BY m.kickoff_iso DESC`))); return;
    }
    if (path === "/matches" && method === "POST") {
      const b = await json(req); const mid = b.id || id("mt");
      await db.execute({ sql: `INSERT INTO matches (id, championship_id, season_id, home_team_id, away_team_id, kickoff_iso, venue, regulation_duration_seconds, extra_time_seconds, video_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, args: [mid, b.championship_id ?? null, b.season_id ?? null, b.home_team_id, b.away_team_id, b.kickoff_iso ?? null, b.venue ?? null, b.regulation_duration_seconds ?? 3600, b.extra_time_seconds ?? 0, b.video_url ?? null, b.status ?? "SCHEDULED"] });
      send(res, 201, { id: mid }); return;
    }
    send(res, 404, { error: "Rota não encontrada", path, method });
  } catch (err) {
    send(res, 400, { error: String(err.message || err) });
  }
}
