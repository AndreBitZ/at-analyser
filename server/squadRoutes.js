import { id, rows } from "./db.js";
import { matchState } from "./rules.js";

export async function squadRoutes(db, req, res, path, method, parts, json, send) {
  const url = new URL(req.url, "http://local");

  if (method === "GET" && path === "/match-squads") {
    const matchId = url.searchParams.get("match_id");
    send(res, 200, rows(await db.execute({
      sql: `SELECT ms.*, p.name AS player_name, p.primary_position, p.shirt_number AS player_number, t.name AS team_name
            FROM match_squads ms
            JOIN players p ON p.id = ms.player_id
            JOIN teams t ON t.id = ms.team_id
            WHERE (? IS NULL OR ms.match_id = ?)
            ORDER BY t.name, p.name`,
      args: [matchId, matchId],
    })));
    return true;
  }

  if (method === "POST" && path === "/match-squads") {
    const b = await json(req);
    await db.execute({
      sql: "INSERT OR REPLACE INTO match_squads (match_id, team_id, player_id, starter) VALUES (?, ?, ?, ?)",
      args: [b.match_id, b.team_id, b.player_id, b.starter ? 1 : 0],
    });
    send(res, 201, { ok: true });
    return true;
  }

  if (method === "DELETE" && parts[0] === "match-squads" && parts[1] && parts[2]) {
    await db.execute({ sql: "DELETE FROM match_squads WHERE match_id = ? AND player_id = ?", args: [parts[1], parts[2]] });
    send(res, 200, { ok: true });
    return true;
  }

  if (method === "GET" && path === "/stints") {
    const matchId = url.searchParams.get("match_id");
    send(res, 200, rows(await db.execute({
      sql: `SELECT st.*, p.name AS player_name FROM stints st JOIN players p ON p.id = st.player_id
            WHERE (? IS NULL OR st.match_id = ?) ORDER BY st.start_timestamp`,
      args: [matchId, matchId],
    })));
    return true;
  }

  if (method === "POST" && path === "/stints/in") {
    const b = await json(req);
    const ts = Number(b.timestamp_seconds || 0);
    const state = await matchState(db, b.match_id, ts);
    const gate = state.canEnter(b.player_id, b.team_id);
    if (!gate.ok) { send(res, 400, { error: gate.reason }); return true; }
    const sid = id("st");
    await db.execute({
      sql: "INSERT INTO stints (id, match_id, player_id, team_id, position_played, start_timestamp, end_timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [sid, b.match_id, b.player_id, b.team_id, b.position_played || "UNKNOWN", ts, 99999],
    });
    send(res, 201, { id: sid });
    return true;
  }

  if (method === "POST" && path === "/stints/out") {
    const b = await json(req);
    const open = rows(await db.execute({
      sql: "SELECT id FROM stints WHERE match_id = ? AND player_id = ? AND end_timestamp >= 99999 ORDER BY start_timestamp DESC LIMIT 1",
      args: [b.match_id, b.player_id],
    }));
    if (!open[0]) { send(res, 400, { error: "Essa atleta não tem período aberto em campo" }); return true; }
    await db.execute({ sql: "UPDATE stints SET end_timestamp = ? WHERE id = ?", args: [Number(b.timestamp_seconds || 0), open[0].id] });
    send(res, 200, { id: open[0].id });
    return true;
  }

  return false;
}
