import { FormEvent, useEffect, useMemo, useState } from "react";
import { get, patch, post } from "./adminApi";
import { formatClock } from "../domain/time";

const TYPES = [
  "SHOT", "ASSIST", "PRE_ASSIST", "TURNOVER", "STEAL", "INTERCEPTION", "RECOVERY",
  "DEFENSIVE_BLOCK", "SEVEN_METER_WON", "TWO_MIN_RECEIVED", "TWO_MIN_DRAWN",
  "YELLOW_CARD", "RED_CARD", "BLUE_CARD", "GOALKEEPER_SAVE",
];
const ZONES = ["Z1","Z2","Z3","Z4","Z5","Z6","Z7","Z8","Z9"];
const BOXES = ["B1","B2","B3","B4","B5","B6","B7","B8","B9"];
const RESULTS = ["GOAL", "SAVED", "MISSED", "POST", "BLOCKED"];

function ytId(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return m?.[1] || null;
}
function minutesOf(stints: any[], playerId: string, now: number) {
  return stints
    .filter((s) => s.player_id === playerId)
    .reduce((acc, s) => {
      const end = s.end_timestamp >= 99999 ? now : s.end_timestamp;
      return acc + Math.max(0, end - s.start_timestamp);
    }, 0) / 60;
}
function liveNow(stints: any[], playerId: string, t: number) {
  return stints.some((s) => s.player_id === playerId && s.start_timestamp <= t && s.end_timestamp > t);
}

export default function FichaJogo() {
  const [matches, setMatches] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [squad, setSquad] = useState<any[]>([]);
  const [stints, setStints] = useState<any[]>([]);
  const [state, setState] = useState<any>(null);
  const [matchId, setMatchId] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [video, setVideo] = useState("");
  const [clockSec, setClockSec] = useState(0);
  const [running, setRunning] = useState(false);
  const [type, setType] = useState("SHOT");
  const [teamId, setTeamId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [z, setZ] = useState("Z5");
  const [b, setB] = useState("B5");
  const [result, setResult] = useState("GOAL");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");

  const match = matches.find((m) => m.id === matchId);
  const clock = formatClock(clockSec);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setClockSec((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  async function loadLists() {
    const ms = await get("/matches");
    const ps = await get("/players");
    setMatches(ms); setPlayers(ps);
    if (!matchId && ms[0]) setMatchId(ms[0].id);
  }
  async function loadMatch(id: string, t = clockSec) {
    if (!id) return;
    const [ev, sq, st, ms, stt] = await Promise.all([
      get(`/events?match_id=${id}`),
      get(`/match-squads?match_id=${id}`),
      get(`/stints?match_id=${id}`),
      get("/matches"),
      get(`/match-state?match_id=${id}&t=${t}`),
    ]);
    setEvents(ev); setSquad(sq); setStints(st); setMatches(ms); setState(stt);
    const m = ms.find((x: any) => x.id === id);
    if (m?.video_url) setVideo(m.video_url);
  }

  useEffect(() => { loadLists().catch(() => {}); }, []);
  useEffect(() => { if (matchId) loadMatch(matchId).catch(() => {}); }, [matchId]);

  const roster = useMemo(() => teamId ? squad.filter((s) => s.team_id === teamId) : squad, [squad, teamId]);

  async function addEvent(e: FormEvent) {
    e.preventDefault();
    if (!matchId || !teamId) return;
    setErr("");
    await post("/events", {
      match_id: matchId,
      timestamp_seconds: clockSec,
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
    setErr("");
    try {
      if (kind === "in") {
        await post("/stints/in", {
          match_id: matchId, player_id: row.player_id, team_id: row.team_id,
          position_played: row.primary_position, timestamp_seconds: clockSec,
        });
      } else {
        await post("/stints/out", { match_id: matchId, player_id: row.player_id, timestamp_seconds: clockSec });
      }
      await loadMatch(matchId);
    } catch (e: any) {
      setErr(e.message);
    }
  }

  const embed = video ? ytId(video) : null;
  const homeOn = state?.onCourtByTeam?.[match?.home_team_id] || 0;
  const awayOn = state?.onCourtByTeam?.[match?.away_team_id] || 0;

  return (
    <div>
      <h2>Ficha de jogo</h2>
      <div className="card" style={{ marginBottom: 12 }}>
        <select value={matchId} onChange={(e) => setMatchId(e.target.value)}>
          <option value="">Jogo</option>
          {matches.map((m) => <option key={m.id} value={m.id}>{m.home_team_name} vs {m.away_team_name}</option>)}
        </select>
      </div>
      {match && (
        <>
          <div className="card" style={{ marginBottom: 12 }}>
            <h3>Cronómetro</h3>
            <p className="stat">{clock}</p>
            <p className="muted">{match.home_team_name} {homeOn} em campo · {match.away_team_name} {awayOn} em campo</p>
            <div className="row" style={{ marginTop: 8 }}>
              <button type="button" onClick={() => setRunning(true)}>Play</button>
              <button type="button" onClick={() => setRunning(false)}>Pausa</button>
              <button type="button" onClick={() => { setRunning(false); setClockSec(0); }}>00:00</button>
              <button type="button" onClick={() => { setRunning(false); setClockSec(1800); }}>2.ª parte 30:00</button>
              <button type="button" onClick={() => loadMatch(matchId, clockSec)}>Actualizar regras</button>
            </div>
            {err && <p className="note">{err}</p>}
          </div>
          <div className="grid">
            <div className="card">
              <h3>Vídeo</h3>
              <div className="stack">
                <input value={video} onChange={(e) => setVideo(e.target.value)} placeholder="URL do vídeo" />
                <button type="button" onClick={() => patch(`/matches/${matchId}`, { video_url: video })}>Guardar ligação</button>
              </div>
              <div style={{ marginTop: 12 }}>
                {embed ? <iframe title="video" width="100%" height="220" src={`https://www.youtube.com/embed/${embed}`} allowFullScreen /> : video ? <video src={video} controls style={{ width: "100%" }} /> : <p className="muted">Sem vídeo.</p>}
              </div>
            </div>
            <form className="card" onSubmit={addEvent}>
              <h3>Marcar acção às {clock}</h3>
              <div className="stack">
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
                <button type="submit">Registar</button>
              </div>
            </form>
          </div>
          <div className="card" style={{ marginTop: 12 }}>
            <h3>Tempo em campo</h3>
            <table>
              <thead><tr><th>Atleta</th><th>Equipa</th><th>Min</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {squad.map((row) => {
                  const min = minutesOf(stints, row.player_id, clockSec);
                  const live = liveNow(stints, row.player_id, clockSec);
                  const red = state?.reds?.includes(row.player_id);
                  const sus = (state?.activeSuspensions || []).find((s: any) => s.player_id === row.player_id);
                  return (
                    <tr key={row.player_id}>
                      <td>{row.player_name}{row.starter ? " · tit." : ""}</td>
                      <td>{row.team_name}</td>
                      <td>{min.toFixed(1)}</td>
                      <td>{red ? "desqualificada" : sus ? `2 min até ${formatClock(sus.end_timestamp)}` : live ? "em campo" : "banco"}</td>
                      <td>
                        {live
                          ? <button type="button" onClick={() => inOut(row, "out")}>Sair</button>
                          : <button type="button" onClick={() => inOut(row, "in")}>Entrar</button>}
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
              <thead><tr><th>Relógio</th><th>Tipo</th><th>Atleta</th></tr></thead>
              <tbody>
                {events.map((ev) => {
                  const pl = players.find((p) => p.id === ev.player_id);
                  return <tr key={ev.id}><td>{formatClock(ev.timestamp_seconds)}</td><td>{ev.type}</td><td>{pl?.name || "—"}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
