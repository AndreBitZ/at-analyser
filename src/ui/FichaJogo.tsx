import { FormEvent, useEffect, useMemo, useState } from "react";
import { get, patch, post } from "./adminApi";
import { formatClock } from "../domain/time";

const TYPES = [
  "SHOT", "ASSIST", "PRE_ASSIST", "TURNOVER", "STEAL", "INTERCEPTION", "RECOVERY",
  "DEFENSIVE_BLOCK", "SEVEN_METER_WON", "TWO_MIN_RECEIVED", "TWO_MIN_DRAWN",
  "GOALKEEPER_SAVE", "SUBSTITUTION_IN", "SUBSTITUTION_OUT",
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

export default function FichaJogo() {
  const [matches, setMatches] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
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
    const [ms, ps] = await Promise.all([get("/matches"), get("/players")]);
    setMatches(ms); setPlayers(ps);
    if (!matchId && ms[0]) setMatchId(ms[0].id);
  }
  async function loadEvents(id: string) {
    if (!id) return;
    const ev = await get(`/events?match_id=${id}`);
    setEvents(ev);
    const m = matches.find((x) => x.id === id);
    if (m?.video_url) setVideo(m.video_url);
  }

  useEffect(() => { loadLists().catch(() => {}); }, []);
  useEffect(() => { if (matchId) loadEvents(matchId).catch(() => setEvents([])); }, [matchId]);

  const roster = useMemo(() => {
    if (!match) return players;
    return players;
  }, [players, match]);

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
    await loadEvents(matchId);
  }

  const embed = video ? ytId(video) : null;

  return (
    <div>
      <h2>Ficha de jogo</h2>
      <p className="muted">Escolhe o jogo, cola o vídeo e marca acções no relógio do jogo (mm:ss).</p>
      <div className="card" style={{ marginBottom: 12 }}>
        <select value={matchId} onChange={(e) => setMatchId(e.target.value)}>
          <option value="">Jogo</option>
          {matches.map((m) => <option key={m.id} value={m.id}>{m.home_team_name} vs {m.away_team_name} · {m.id}</option>)}
        </select>
      </div>
      {match && (
        <>
          <div className="grid">
            <div className="card">
              <h3>Vídeo</h3>
              <div className="stack">
                <input value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://youtube.com/... ou ficheiro" />
                <button type="button" onClick={saveVideo}>Guardar ligação</button>
              </div>
              <div style={{ marginTop: 12 }}>
                {embed ? (
                  <iframe title="video" width="100%" height="240" src={`https://www.youtube.com/embed/${embed}`} allowFullScreen />
                ) : video ? (
                  <video src={video} controls style={{ width: "100%" }} />
                ) : <p className="muted">Sem vídeo.</p>}
              </div>
            </div>
            <form className="card" onSubmit={addEvent}>
              <h3>Marcar evento</h3>
              <div className="stack">
                <input value={clock} onChange={(e) => setClock(e.target.value)} placeholder="12:30" />
                <select value={teamId} onChange={(e) => setTeamId(e.target.value)} required>
                  <option value="">Equipa</option>
                  <option value={match.home_team_id}>{match.home_team_name}</option>
                  <option value={match.away_team_id}>{match.away_team_name}</option>
                </select>
                <select value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
                  <option value="">Atleta</option>
                  {roster.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
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
            <h3>Linha de eventos ({events.length})</h3>
            <table>
              <thead><tr><th>Relógio</th><th>Bloco</th><th>Tipo</th><th>Atleta</th><th>Remate</th><th>Nota</th></tr></thead>
              <tbody>
                {events.map((ev) => {
                  let shot: any = null;
                  try { shot = ev.shot_json ? JSON.parse(ev.shot_json) : null; } catch { shot = null; }
                  let ctx: any = {};
                  try { ctx = ev.context_json ? JSON.parse(ev.context_json) : {}; } catch { ctx = {}; }
                  const pl = players.find((p) => p.id === ev.player_id);
                  return (
                    <tr key={ev.id}>
                      <td>{formatClock(ev.timestamp_seconds)}</td>
                      <td>{ctx.five_minute_block || "—"}</td>
                      <td>{ev.type}</td>
                      <td>{pl?.name || "—"}</td>
                      <td>{shot ? `${shot.field_shot_zone} → ${shot.goal_target_zone || "—"} (${shot.shot_result})` : "—"}</td>
                      <td>{ev.notes || "—"}</td>
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
