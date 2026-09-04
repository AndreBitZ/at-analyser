import { FormEvent, useEffect, useMemo, useState } from "react";
import { get, patch, post } from "./adminApi";
import { formatClock } from "../domain/time";

const TYPES = [
  "SHOT", "ASSIST", "PRE_ASSIST", "TURNOVER", "STEAL", "INTERCEPTION", "RECOVERY",
  "DEFENSIVE_BLOCK", "SEVEN_METER_WON", "TWO_MIN_RECEIVED", "TWO_MIN_DRAWN",
  "GOALKEEPER_SAVE",
];
const ZONES = ["Z1","Z2","Z3","Z4","Z5","Z6","Z7","Z8","Z9"];
const BOXES = ["B1","B2","B3","B4","B5","B6","B7","B8","B9"];
const RESULTS = ["GOAL", "SAVED", "MISSED", "POST", "BLOCKED"];

function parseClock(v: string) {
  const m = v.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return Number(v) || 0;
  return Number(m[1]) * 60 + Number(m[2]);
}
function ytId(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return m?.[1] || null;
}
function minutesOf(stints: any[], playerId: string) {
  return stints
    .filter((s) => s.player_id === playerId)
    .reduce((acc, s) => {
      const end = s.end_timestamp >= 99999 ? s.start_timestamp : s.end_timestamp;
      return acc + Math.max(0, end - s.start_timestamp);
    }, 0) / 60;
}
function onCourt(stints: any[], playerId: string) {
  return stints.some((s) => s.player_id === playerId && s.end_timestamp >= 99999);
}

export default function FichaJogo() {
  const [matches, setMatches] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [squad, setSquad] = useState<any[]>([]);
  const [stints, setStints] = useState<any[]>([]);
  const [matchId, setMatchId] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [video, setVideo] = useState("");
  const [clock, setClock] = useState("00:00");
  const [type, setType] = useState("SHOT");
  const [teamId, setTeamId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [z, setZ] = useState("Z5");
  const [b, setB] = useState("B5");
  const [result, setResult] = useState("GOAL");
  const [notes, setNotes] = useState("");

  const match = matches.find((m) => m.id === matchId);

  async function loadLists() {
    const ms = await get("/matches");
    const ps = await get("/players");
    setMatches(ms); setPlayers(ps);
    if (!matchId && ms[0]) setMatchId(ms[0].id);
  }
  async function loadMatch(id: string) {
    if (!id) return;
    const [ev, sq, st, ms] = await Promise.all([
      get(`/events?match_id=${id}`),
      get(`/match-squads?match_id=${id}`),
      get(`/stints?match_id=${id}`),
      get("/matches"),
    ]);
    setEvents(ev); setSquad(sq); setStints(st); setMatches(ms);
    const m = ms.find((x: any) => x.id === id);
    if (m?.video_url) setVideo(m.video_url);
  }

  useEffect(() => { loadLists().catch(() => {}); }, []);
  useEffect(() => { if (matchId) loadMatch(matchId).catch(() => {}); }, [matchId]);

  const roster = useMemo(() => {
    if (!teamId) return squad;
    return squad.filter((s) => s.team_id === teamId);
  }, [squad, teamId]);

  async function saveVideo() {
    if (!matchId) return;
    await patch(`/matches/${matchId}`, { video_url: video });
  }

  async function addEvent(e: FormEvent) {
    e.preventDefault();
    if (!matchId || !teamId) return;
    await post("/events", {
      match_id: matchId,
      timestamp_seconds: parseClock(clock),
      team_id: teamId,
      player_id: playerId || null,
      type,
      field_shot_zone: type === "SHOT" ? z : undefined,
      goal_target_zone: type === "SHOT" ? b : undefined,
      shot_result: type === "SHOT" ? result : undefined,
      notes,
    });
    setNotes("");
    await loadMatch(matchId);
  }

  async function inOut(row: any, kind: "in" | "out") {
    const ts = parseClock(clock);
    if (kind === "in") {
      await post("/stints/in", {
        match_id: matchId,
        player_id: row.player_id,
        team_id: row.team_id,
        position_played: row.primary_position,
        timestamp_seconds: ts,
      });
    } else {
      await post("/stints/out", { match_id: matchId, player_id: row.player_id, timestamp_seconds: ts });
    }
    await loadMatch(matchId);
  }

  const embed = video ? ytId(video) : null;

  return (
    <div>
      <h2>Ficha de jogo</h2>
      <p className="muted">Só aparecem as convocadas. Usa o relógio para acções e para entradas/saídas.</p>
      <div className="card" style={{ marginBottom: 12 }}>
        <select value={matchId} onChange={(e) => setMatchId(e.target.value)}>
          <option value="">Jogo</option>
          {matches.map((m) => <option key={m.id} value={m.id}>{m.home_team_name} vs {m.away_team_name}</option>)}
        </select>
      </div>
      {match && (
        <>
          <div className="grid">
            <div className="card">
              <h3>Vídeo</h3>
              <div className="stack">
                <input value={video} onChange={(e) => setVideo(e.target.value)} placeholder="URL do vídeo" />
                <button type="button" onClick={saveVideo}>Guardar ligação</button>
              </div>
              <div style={{ marginTop: 12 }}>
                {embed ? <iframe title="video" width="100%" height="220" src={`https://www.youtube.com/embed/${embed}`} allowFullScreen /> : video ? <video src={video} controls style={{ width: "100%" }} /> : <p className="muted">Sem vídeo.</p>}
              </div>
            </div>
            <form className="card" onSubmit={addEvent}>
              <h3>Marcar acção</h3>
              <div className="stack">
                <input value={clock} onChange={(e) => setClock(e.target.value)} placeholder="12:30" />
                <select value={teamId} onChange={(e) => { setTeamId(e.target.value); setPlayerId(""); }} required>
                  <option value="">Equipa</option>
                  <option value={match.home_team_id}>{match.home_team_name}</option>
                  <option value={match.away_team_id}>{match.away_team_name}</option>
                </select>
                <select value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
                  <option value="">Atleta convocada</option>
                  {roster.map((p) => <option key={p.player_id} value={p.player_id}>{p.player_name}</option>)}
                </select>
                <select value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
                {type === "SHOT" && (
                  <>
                    <select value={z} onChange={(e) => setZ(e.target.value)}>{ZONES.map((x) => <option key={x}>{x}</option>)}</select>
                    <select value={b} onChange={(e) => setB(e.target.value)}>{BOXES.map((x) => <option key={x}>{x}</option>)}</select>
                    <select value={result} onChange={(e) => setResult(e.target.value)}>{RESULTS.map((x) => <option key={x}>{x}</option>)}</select>
                  </>
                )}
                <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Nota" />
                <button type="submit">Registar acção</button>
              </div>
            </form>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <h3>Tempo em campo</h3>
            <p className="muted">Relógio actual: {clock}. Titular: põe Entrar a 00:00 no início.</p>
            {!squad.length && <p className="note">Define a convocatória em Jogos primeiro.</p>}
            <table>
              <thead><tr><th>Atleta</th><th>Equipa</th><th>Min</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {squad.map((row) => {
                  const min = minutesOf(stints, row.player_id);
                  const live = onCourt(stints, row.player_id);
                  return (
                    <tr key={row.player_id}>
                      <td>{row.player_name}{row.starter ? " · tit." : ""}</td>
                      <td>{row.team_name}</td>
                      <td>{min.toFixed(1)}</td>
                      <td>{live ? "em campo" : "banco"}</td>
                      <td>
                        {live
                          ? <button type="button" onClick={() => inOut(row, "out")}>Sair {clock}</button>
                          : <button type="button" onClick={() => inOut(row, "in")}>Entrar {clock}</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <h3>Linha de eventos ({events.length})</h3>
            <table>
              <thead><tr><th>Relógio</th><th>Bloco</th><th>Tipo</th><th>Atleta</th><th>Remate</th></tr></thead>
              <tbody>
                {events.map((ev) => {
                  let shot: any = null; let ctx: any = {};
                  try { shot = ev.shot_json ? JSON.parse(ev.shot_json) : null; } catch { /* */ }
                  try { ctx = ev.context_json ? JSON.parse(ev.context_json) : {}; } catch { /* */ }
                  const pl = players.find((p) => p.id === ev.player_id);
                  return (
                    <tr key={ev.id}>
                      <td>{formatClock(ev.timestamp_seconds)}</td>
                      <td>{ctx.five_minute_block || "—"}</td>
                      <td>{ev.type}</td>
                      <td>{pl?.name || "—"}</td>
                      <td>{shot ? `${shot.field_shot_zone} → ${shot.goal_target_zone || "—"} (${shot.shot_result})` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
