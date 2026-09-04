import { copyFileSync } from "node:fs";
import { join } from "node:path";
import { rows } from "./db.js";
import { getWorkspace } from "./workspace.js";

export async function improveRoutes(db, req, res, path, method, parts, json, send) {
  if (method === "POST" && path === "/backup") {
    const { root } = getWorkspace();
    if (!root) { send(res, 400, { error: "sem pasta" }); return true; }
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const dest = join(root, "exportacoes", `backup-${stamp}.db`);
    copyFileSync(join(root, "db", "at-analyser.db"), dest);
    send(res, 200, { file: dest });
    return true;
  }
  if (method === "GET" && path === "/search") {
    const q = `%${new URL(req.url, "http://l").searchParams.get("q") || ""}%`;
    if (q === "%%") { send(res, 200, { players: [], clubs: [], matches: [], watch: [] }); return true; }
    send(res, 200, {
      players: rows(await db.execute({ sql: "SELECT id, name, primary_position FROM players WHERE name LIKE ? LIMIT 20", args: [q] })),
      clubs: rows(await db.execute({ sql: "SELECT id, name FROM clubs WHERE name LIKE ? LIMIT 10", args: [q] })),
      matches: rows(await db.execute({ sql: `SELECT m.id, ht.name AS home, at.name AS away FROM matches m JOIN teams ht ON ht.id=m.home_team_id JOIN teams at ON at.id=m.away_team_id WHERE ht.name LIKE ? OR at.name LIKE ? LIMIT 15`, args: [q, q] })),
      watch: rows(await db.execute({ sql: `SELECT w.id, p.name AS player_name, w.status FROM watchlist w JOIN players p ON p.id=w.player_id WHERE p.name LIKE ? OR w.attack_note LIKE ? LIMIT 10`, args: [q, q] })),
    });
    return true;
  }
  if (method === "POST" && path === "/events/undo") {
    const b = await json(req);
    const last = rows(await db.execute({
      sql: "SELECT id FROM events WHERE match_id = ? ORDER BY timestamp_seconds DESC, id DESC LIMIT 1",
      args: [b.match_id],
    }))[0];
    if (!last) { send(res, 404, { error: "nada a anular" }); return true; }
    await db.execute({ sql: "DELETE FROM events WHERE id = ?", args: [last.id] });
    send(res, 200, { id: last.id });
    return true;
  }
  return false;
}
