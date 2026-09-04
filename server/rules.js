import { id, rows } from "./db.js";

const TWO = 120;
const MAX_PASSES = 6;
const MAX_ON = 7;

async function closeStint(db, matchId, playerId, ts) {
  const open = rows(await db.execute({
    sql: "SELECT id FROM stints WHERE match_id = ? AND player_id = ? AND end_timestamp >= 99999 ORDER BY start_timestamp DESC LIMIT 1",
    args: [matchId, playerId],
  }));
  if (open[0]) await db.execute({ sql: "UPDATE stints SET end_timestamp = ? WHERE id = ?", args: [ts, open[0].id] });
}

async function addSuspension(db, ev, ts) {
  await db.execute({
    sql: "INSERT INTO suspensions (id, match_id, team_id, player_id, start_timestamp, end_timestamp) VALUES (?, ?, ?, ?, ?, ?)",
    args: [id("sus"), ev.match_id, ev.team_id, ev.player_id, ts, ts + TWO],
  });
}

export async function applySanction(db, ev) {
  const type = ev.type;
  const ts = Number(ev.timestamp_seconds || 0);
  if (type === "TWO_MIN_RECEIVED" && ev.player_id) {
    await closeStint(db, ev.match_id, ev.player_id, ts);
    await addSuspension(db, ev, ts);
    const prev = rows(await db.execute({
      sql: "SELECT COUNT(*) AS n FROM events WHERE match_id = ? AND player_id = ? AND type = 'TWO_MIN_RECEIVED'",
      args: [ev.match_id, ev.player_id],
    }));
    if (Number(prev[0]?.n || 0) >= 3) {
      await db.execute({
        sql: "INSERT INTO events (id, match_id, timestamp_seconds, team_id, player_id, type, shot_json, context_json, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        args: [id("ev"), ev.match_id, ts, ev.team_id, ev.player_id, "RED_CARD", null, JSON.stringify({ auto: "3rd_two_min" }), "3.ª exclusão IHF"],
      });
    }
    return;
  }
  if (["RED_CARD", "BLUE_CARD", "DISQUALIFICATION"].includes(type) && ev.player_id) {
    await closeStint(db, ev.match_id, ev.player_id, ts);
    await addSuspension(db, ev, ts);
  }
}

function describeGk(team, opp, teamHasSus) {
  const gk = team.gkOn;
  const field = team.field;
  const oppField = opp.field;
  const oppGk = opp.gkOn;
  if (gk && field === 6 && oppGk && oppField === 6) return { code: "7v7_GK", label: "7×7 com GR" };
  if (gk && field < 6) return { code: "INFERIORITY_GK", label: `Inferioridade com GR (${field}+GR)` };
  if (!gk && field === 7 && oppGk && oppField === 6) return { code: "7v6", label: "Ataque 7×6 (GR fora)" };
  if (!gk && teamHasSus && field === 6) return { code: "EMPTY_EQUALIZE", label: "GR fora para igualar exclusão" };
  if (!gk && field >= 6) return { code: "EMPTY_GOAL", label: `Baliza vazia (${field} de campo)` };
  if (gk) return { code: "GK_ON", label: `GR em campo (${field}+GR)` };
  return { code: "NO_GK", label: "Sem GR em campo" };
}

export async function matchState(db, matchId, clock) {
  const t = Number(clock || 0);
  const match = rows(await db.execute({ sql: "SELECT * FROM matches WHERE id = ?", args: [matchId] }))[0];
  const stints = rows(await db.execute({ sql: "SELECT * FROM stints WHERE match_id = ?", args: [matchId] }));
  const sus = rows(await db.execute({ sql: "SELECT * FROM suspensions WHERE match_id = ?", args: [matchId] }));
  const events = rows(await db.execute({ sql: "SELECT * FROM events WHERE match_id = ? ORDER BY timestamp_seconds, id", args: [matchId] }));
  const plist = rows(await db.execute("SELECT id, is_goalkeeper, primary_position FROM players"));
  const isGk = {};
  for (const p of plist) isGk[p.id] = Number(p.is_goalkeeper) === 1 || p.primary_position === "GK";

  const reds = new Set(events.filter((e) => ["RED_CARD", "BLUE_CARD", "DISQUALIFICATION"].includes(e.type)).map((e) => e.player_id));
  const twoMinCount = {};
  for (const e of events.filter((x) => x.type === "TWO_MIN_RECEIVED")) {
    twoMinCount[e.player_id] = (twoMinCount[e.player_id] || 0) + 1;
  }
  const onCourtRows = stints.filter((s) => s.start_timestamp <= t && s.end_timestamp > t);
  const onCourt = onCourtRows.map((s) => s.player_id);
  const activeSus = sus.filter((s) => s.start_timestamp <= t && t < s.end_timestamp);
  const byTeam = {};
  const shape = {};
  for (const s of onCourtRows) {
    byTeam[s.team_id] = (byTeam[s.team_id] || 0) + 1;
    if (!shape[s.team_id]) shape[s.team_id] = { total: 0, field: 0, gkOn: false, gkId: null };
    shape[s.team_id].total += 1;
    if (isGk[s.player_id]) { shape[s.team_id].gkOn = true; shape[s.team_id].gkId = s.player_id; }
    else shape[s.team_id].field += 1;
  }

  let passive = { active: false, passes: 0, remaining: MAX_PASSES, warningAt: null };
  for (const e of events.filter((x) => x.timestamp_seconds <= t)) {
    if (e.type === "PASSIVE_WARNING") passive = { active: true, passes: 0, remaining: MAX_PASSES, warningAt: e.timestamp_seconds };
    if (passive.active && e.type === "PASS") {
      passive.passes += 1;
      passive.remaining = Math.max(0, MAX_PASSES - passive.passes);
    }
    if (["SHOT", "GOAL", "PASSIVE_TURNOVER", "TURNOVER"].includes(e.type)) {
      passive = { active: false, passes: 0, remaining: MAX_PASSES, warningAt: null };
    }
  }

  const homeId = match?.home_team_id;
  const awayId = match?.away_team_id;
  const empty = { total: 0, field: 0, gkOn: false, gkId: null };
  const home = shape[homeId] || empty;
  const away = shape[awayId] || empty;
  const homeSus = activeSus.some((s) => s.team_id === homeId);
  const awaySus = activeSus.some((s) => s.team_id === awayId);

  function canEnter(playerId, teamId) {
    if (reds.has(playerId)) return { ok: false, reason: "Desqualificada — não volta (IHF)" };
    if (activeSus.find((s) => s.player_id === playerId)) return { ok: false, reason: "Exclusão 2 min" };
    const onThis = byTeam[teamId] || 0;
    if (onThis >= MAX_ON) return { ok: false, reason: "Já há 7 em campo" };
    const teamWait = activeSus.find((s) => s.team_id === teamId && reds.has(s.player_id));
    if (teamWait && onThis >= 6) return { ok: false, reason: "Inferioridade 2 min após vermelho/azul" };
    return { ok: true };
  }

  return {
    clock: t,
    onCourt,
    onCourtByTeam: byTeam,
    reds: [...reds],
    twoMinCount,
    activeSuspensions: activeSus,
    passive,
    gk: {
      home: { ...home, situation: describeGk(home, away, homeSus) },
      away: { ...away, situation: describeGk(away, home, awaySus) },
    },
    canEnter,
  };
}
