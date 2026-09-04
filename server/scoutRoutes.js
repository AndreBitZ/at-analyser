import { id, rows } from "./db.js";

export async function scoutRoutes(db, req, res, path, method, parts, json, send) {
  const url = new URL(req.url, "http://local");

  if (method === "GET" && path === "/watchlist") {
    send(res, 200, rows(await db.execute(`
      SELECT w.*, p.name AS player_name, p.primary_position, c.name AS club_name
      FROM watchlist w
      JOIN players p ON p.id = w.player_id
      LEFT JOIN clubs c ON c.id = p.club_id
      ORDER BY w.updated_at DESC`)));
    return true;
  }
  if (method === "POST" && path === "/watchlist") {
    const b = await json(req);
    const wid = id("wl");
    await db.execute({
      sql: `INSERT INTO watchlist (id, player_id, status, attack_note, defense_note, read_note, rating, clips, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [wid, b.player_id, b.status || "SEGUIR", b.attack_note || null, b.defense_note || null, b.read_note || null, Number(b.rating || 3), b.clips || null],
    });
    send(res, 201, { id: wid });
    return true;
  }
  if (method === "PATCH" && parts[0] === "watchlist" && parts[1]) {
    const b = await json(req);
    await db.execute({
      sql: `UPDATE watchlist SET status=COALESCE(?,status), attack_note=COALESCE(?,attack_note), defense_note=COALESCE(?,defense_note),
            read_note=COALESCE(?,read_note), rating=COALESCE(?,rating), clips=COALESCE(?,clips), updated_at=datetime('now') WHERE id=?`,
      args: [b.status ?? null, b.attack_note ?? null, b.defense_note ?? null, b.read_note ?? null, b.rating ?? null, b.clips ?? null, parts[1]],
    });
    send(res, 200, { ok: true });
    return true;
  }
  if (method === "DELETE" && parts[0] === "watchlist" && parts[1]) {
    await db.execute({ sql: "DELETE FROM watchlist WHERE id = ?", args: [parts[1]] });
    send(res, 200, { ok: true });
    return true;
  }

  if (method === "GET" && path === "/opponent-report") {
    const teamId = url.searchParams.get("team_id");
    if (!teamId) { send(res, 400, { error: "team_id" }); return true; }
    const matches = rows(await db.execute({
      sql: `SELECT m.*, ht.name AS home_name, at.name AS away_name FROM matches m
            JOIN teams ht ON ht.id = m.home_team_id JOIN teams at ON at.id = m.away_team_id
            WHERE m.home_team_id = ? OR m.away_team_id = ? ORDER BY m.kickoff_iso DESC`,
      args: [teamId, teamId],
    }));
    const events = rows(await db.execute({
      sql: `SELECT e.* FROM events e JOIN matches m ON m.id = e.match_id
            WHERE m.home_team_id = ? OR m.away_team_id = ?`,
      args: [teamId, teamId],
    }));
    const mine = events.filter((e) => e.team_id === teamId);
    const zones = {};
    const boxes = {};
    let goals = 0, shots = 0, seven6 = 0, crunchGoals = 0;
    const systems = {};
    for (const e of mine) {
      let shot = null; let ctx = {};
      try { shot = e.shot_json ? JSON.parse(e.shot_json) : null; } catch { /* */ }
      try { ctx = e.context_json ? JSON.parse(e.context_json) : {}; } catch { /* */ }
      if (e.type === "SHOT") {
        shots += 1;
        if (shot?.field_shot_zone) zones[shot.field_shot_zone] = (zones[shot.field_shot_zone] || 0) + 1;
        if (shot?.goal_target_zone) boxes[shot.goal_target_zone] = (boxes[shot.goal_target_zone] || 0) + 1;
        if (shot?.shot_result === "GOAL") {
          goals += 1;
          if (Number(e.timestamp_seconds) >= 3000) crunchGoals += 1;
        }
      }
      if (ctx.defense_system) systems[ctx.defense_system] = (systems[ctx.defense_system] || 0) + 1;
      if (ctx.gk_situation === "7v6" || e.notes === "7v6") seven6 += 1;
    }
    send(res, 200, {
      team_id: teamId,
      matches: matches.length,
      shots, goals, pct: shots ? Math.round((goals / shots) * 100) : 0,
      zones, boxes, systems,
      seven6, crunchGoals,
      twoMin: mine.filter((e) => e.type === "TWO_MIN_RECEIVED").length,
      turnovers: mine.filter((e) => e.type === "TURNOVER").length,
      games: matches,
    });
    return true;
  }
  return false;
}
