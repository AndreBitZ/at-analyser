import { id, rows } from "./db.js";

const TWO = 120;

async function closeStint(db, matchId, playerId, ts) {
  const open = rows(await db.execute({
    sql: "SELECT id FROM stints WHERE match_id = ? AND player_id = ? AND end_timestamp >= 99999 ORDER BY start_timestamp DESC LIMIT 1",
    args: [matchId, playerId],
  }));
  if (open[0]) {
    await db.execute({ sql: "UPDATE stints SET end_timestamp = ? WHERE id = ?", args: [ts, open[0].id] });
  }
}

export async function applySanction(db, ev) {
  const type = ev.type;
  const ts = Number(ev.timestamp_seconds || 0);
  if (!ev.player_id) return;
  if (type === "TWO_MIN_RECEIVED") {
    await closeStint(db, ev.match_id, ev.player_id, ts);
    await db.execute({
      sql: "INSERT INTO suspensions (id, match_id, team_id, player_id, start_timestamp, end_timestamp) VALUES (?, ?, ?, ?, ?, ?)",
      args: [id("sus"), ev.match_id, ev.team_id, ev.player_id, ts, ts + TWO],
    });
    return;
  }
  if (type === "RED_CARD" || type === "BLUE_CARD" || type === "DISQUALIFICATION") {
    await closeStint(db, ev.match_id, ev.player_id, ts);
    await db.execute({
      sql: "INSERT INTO suspensions (id, match_id, team_id, player_id, start_timestamp, end_timestamp) VALUES (?, ?, ?, ?, ?, ?)",
      args: [id("sus"), ev.match_id, ev.team_id, ev.player_id, ts, ts + TWO],
    });
  }
}

export async function matchState(db, matchId, clock) {
  const t = Number(clock || 0);
  const stints = rows(await db.execute({ sql: "SELECT * FROM stints WHERE match_id = ?", args: [matchId] }));
  const sus = rows(await db.execute({ sql: "SELECT * FROM suspensions WHERE match_id = ?", args: [matchId] }));
  const events = rows(await db.execute({ sql: "SELECT * FROM events WHERE match_id = ?", args: [matchId] }));
  const reds = new Set(events.filter((e) => ["RED_CARD", "BLUE_CARD", "DISQUALIFICATION"].includes(e.type)).map((e) => e.player_id));
  const onCourt = stints.filter((s) => s.start_timestamp <= t && s.end_timestamp > t).map((s) => s.player_id);
  const activeSus = sus.filter((s) => s.start_timestamp <= t && t < s.end_timestamp);
  function canEnter(playerId, teamId) {
    if (reds.has(playerId)) return { ok: false, reason: "Desqualificada — não volta a entrar" };
    const mine = activeSus.find((s) => s.player_id === playerId);
    if (mine) return { ok: false, reason: `2 min até ${fmt(mine.end_timestamp)}` };
    const teamWait = activeSus.find((s) => s.team_id === teamId && reds.has(s.player_id));
    if (teamWait && !onCourt.includes(playerId)) {
      const onThis = stints.filter((s) => s.team_id === teamId && s.start_timestamp <= t && s.end_timestamp > t).length;
      if (onThis >= 5) return { ok: false, reason: `Equipa em inferioridade até ${fmt(teamWait.end_timestamp)}` };
    }
    return { ok: true };
  }
  const byTeam = {};
  for (const s of stints) {
    if (s.start_timestamp <= t && s.end_timestamp > t) {
      byTeam[s.team_id] = (byTeam[s.team_id] || 0) + 1;
    }
  }
  return { clock: t, onCourt, activeSuspensions: activeSus, reds: [...reds], onCourtByTeam: byTeam, canEnter };
}

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
