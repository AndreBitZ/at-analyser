import { id, rows } from "./db.js";
import { applySanction, matchState } from "./rules.js";

function blockOf(sec) {
  const i = Math.floor(Number(sec || 0) / 300);
  const codes = ["P1_00_05","P1_05_10","P1_10_15","P1_15_20","P1_20_25","P1_25_30","P2_30_35","P2_35_40","P2_40_45","P2_45_50","P2_50_55","P2_55_60"];
  return codes[i] || `ET_${i}`;
}

export async function eventsRoutes(db, req, res, path, method, parts, json, send) {
  if (method === "GET" && path === "/match-state") {
    const url = new URL(req.url, "http://local");
    const matchId = url.searchParams.get("match_id");
    const t = Number(url.searchParams.get("t") || 0);
    if (!matchId) { send(res, 400, { error: "match_id" }); return true; }
    const raw = await matchState(db, matchId, t);
    send(res, 200, {
      clock: raw.clock,
      onCourt: raw.onCourt,
      onCourtByTeam: raw.onCourtByTeam,
      reds: raw.reds,
      twoMinCount: raw.twoMinCount,
      activeSuspensions: raw.activeSuspensions,
      passive: raw.passive,
    });
    return true;
  }
  if (method === "GET" && path === "/events") {
    const matchId = new URL(req.url, "http://local").searchParams.get("match_id");
    send(res, 200, rows(await db.execute(matchId
      ? { sql: "SELECT * FROM events WHERE match_id = ? ORDER BY timestamp_seconds", args: [matchId] }
      : { sql: "SELECT * FROM events ORDER BY timestamp_seconds", args: [] })));
    return true;
  }
  if (method === "POST" && path === "/events") {
    const b = await json(req);
    const eid = b.id || id("ev");
    const ts = Number(b.timestamp_seconds || 0);
    const ctx = b.context_json || JSON.stringify({
      five_minute_block: blockOf(ts),
      five_minute_block_index: Math.floor(ts / 300),
      numerical_context: b.numerical_context || "EVEN_6V6",
      passive_context: b.passive_context || "NO_PASSIVE",
      score_difference_before: Number(b.score_difference_before || 0),
    });
    const shot = b.shot_json || (b.field_shot_zone ? JSON.stringify({
      field_shot_zone: b.field_shot_zone,
      goal_target_zone: b.goal_target_zone || null,
      shot_result: b.shot_result || "MISSED",
    }) : null);
    await db.execute({
      sql: `INSERT INTO events (id, match_id, timestamp_seconds, team_id, player_id, type, shot_json, context_json, clip_url, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [eid, b.match_id, ts, b.team_id, b.player_id || null, b.type, shot, ctx, b.clip_url || null, b.notes || null],
    });
    await applySanction(db, { ...b, timestamp_seconds: ts, type: b.type });
    send(res, 201, { id: eid });
    return true;
  }
  if (method === "DELETE" && parts[0] === "events" && parts[1]) {
    await db.execute({ sql: "DELETE FROM events WHERE id = ?", args: [parts[1]] });
    send(res, 200, { ok: true });
    return true;
  }
  return false;
}
