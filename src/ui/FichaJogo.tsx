import { FormEvent, useEffect, useMemo, useState } from "react";
import { get, patch, post } from "./adminApi";
import { formatClock } from "../domain/time";
import { eventsForFilter, StatsPanel, TimelinePanel, type StatFilter } from "./MatchTimeline";
import { KEY_HELP, TAG_KEYS } from "./tagKeys";
import TagBoard from "./TagBoard";

const TYPES = [
  "SHOT", "ASSIST", "PRE_ASSIST", "TURNOVER", "STEAL", "INTERCEPTION", "RECOVERY",
  "DEFENSIVE_BLOCK", "SEVEN_METER_WON", "TWO_MIN_RECEIVED", "TWO_MIN_DRAWN",
  "YELLOW_CARD", "RED_CARD", "BLUE_CARD", "GOALKEEPER_SAVE",
  "PASSIVE_WARNING", "PASS", "PASSIVE_TURNOVER", "POSSESSION_START", "POSSESSION_END",
];
const ZONES = ["Z1","Z2","Z3","Z4","Z5","Z6","Z7","Z8","Z9"];
const BOXES = ["B1","B2","B3","B4","B5","B6","B7","B8","B9"];
const RESULTS = ["GOAL", "SAVED", "MISSED", "POST", "BLOCKED"];

function ytId(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return m?.[1] || null;
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
  const [filter, setFilter] = useState<StatFilter>(null);
  const [attackType, setAttackType] = useState("POSITIONAL");
  const [defenseSystem, setDefenseSystem] = useState("6-0");

  const match = matches.find((m) => m.id === matchId);
  const clock = formatClock(clockSec);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setClockSec((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  async function loadMatch(id: string, t = clockSec) {
    if (!id) return;
    const [ev, sq, st, ms, stt] = await Promise.all([
      get(`/events?match_id=${id}`), get(`/match-squads?match_id=${id}`),
      get(`/stints?match_id=${id}`), get("/matches"), get(`/match-state?match_id=${id}&t=${t}`),
    ]);
    setEvents(ev); setSquad(sq); setStints(st); setMatches(ms); setState(stt);
    const m = ms.find((x: any) => x.id === id);
    if (m?.video_url) setVideo(m.video_url);
  }

  async function saveEvent() {
    if (!matchId || !teamId) return;
    await post("/events", {
      match_id: matchId, timestamp_seconds: clockSec, team_id: teamId, player_id: playerId || null, type,
      field_shot_zone: type === "SHOT" ? z : undefined,
      goal_target_zone: type === "SHOT" ? b : undefined,
      shot_result: type === "SHOT" ? result : undefined,
      attack_type: attackType,
      defense_system: defenseSystem,
      possession_phase: type === "POSSESSION_START" ? "START" : type === "POSSESSION_END" ? "END" : null,
      notes,
    });
    setNotes("");
    await loadMatch(matchId);
  }

  async function undo() {
    if (!matchId) return;
    try { await post("/events/undo", { match_id: matchId }); await loadMatch(matchId); }
    catch (e: any) { setErr(e.message); }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") return;
      const mapped = TAG_KEYS[e.key.toLowerCase()];
      if (mapped) { e.preventDefault(); setType(mapped); }
      if (e.key === " ") { e.preventDefault(); setRunning((r) => !r); }
      if (e.key === "Enter") { e.preventDefault(); saveEvent(); }
      if (e.key === "z" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); undo(); }
      if (e.key === "ArrowLeft") setClockSec((s) => Math.max(0, s - 2));
      if (e.key === "ArrowRight") setClockSec((s) => s + 2);
      if (e.key === "h") setTeamId(match?.home_team_id || "");
      if (e.key === "f") setTeamId(match?.away_team_id || "");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [match, matchId, teamId, playerId, type, clockSec, z, b, result, attackType, defenseSystem]);

  useEffect(() => { get("/matches").then((ms) => { setMatches(ms); if (!matchId && ms[0]) setMatchId(ms[0].id); }).catch(() => {}); get("/players").then(setPlayers).catch(() => {}); }, []);
  useEffect(() => { if (matchId) loadMatch(matchId).catch(() => {}); }, [matchId]);

  const roster = useMemo(() => teamId ? squad.filter((s) => s.team_id === teamId) : squad, [squad, teamId]);
  const shown = useMemo(() => eventsForFilter(events, filter), [events, filter]);
  async function addEvent(e: FormEvent) { e.preventDefault(); await saveEvent(); }
  const embed = video ? ytId(video) : null;

  return (
    <div>
      <h2>Ficha de jogo</h2>
      <p className="muted">Espaço play · Enter regista · Ctrl+Z anula · {KEY_HELP.map((k) => k[0]).join(" ")}</p>
      <div className="card" style={{ marginBottom: 12 }}>
        <select value={matchId} onChange={(e) => setMatchId(e.target.value)}>
          <option value="">Jogo</option>
          {matches.map((m) => <option key={m.id} value={m.id}>{m.home_team_name} vs {m.away_team_name}</option>)}
        </select>
      </div>
      {match && (
        <>
          <div className="card" style={{ marginBottom: 12 }}>
            <h3>Cronómetro {clock}</h3>
            <p className="muted">{match.home_team_name} {state?.gk?.home?.situation?.label} · {match.away_team_name} {state?.gk?.away?.situation?.label}</p>
            <p className="muted">Ataque {attackType} · Defesa {defenseSystem}</p>
            <button type="button" onClick={() => setRunning((r) => !r)}>{running ? "Pausa" : "Play"}</button>
            <button type="button" onClick={undo}>Anular último</button>
            {playerId && <button type="button" onClick={() => post("/watchlist", { player_id: playerId, status: "SEGUIR" })}>Watchlist</button>}
            {err && <p className="note">{err}</p>}
          </div>
          <div className="grid">
            <div className="card">
              <h3>Vídeo</h3>
              <input value={video} onChange={(e) => setVideo(e.target.value)} placeholder="URL" />
              <button type="button" onClick={() => patch(`/matches/${matchId}`, { video_url: video })}>Guardar</button>
              {embed ? <iframe title="v" width="100%" height="200" src={`https://www.youtube.com/embed/${embed}?start=${clockSec}`} allowFullScreen /> : video ? <video src={video} controls style={{ width: "100%" }} /> : null}
            </div>
            <TagBoard squad={squad} teamId={teamId} playerId={playerId} type={type} attackType={attackType} defenseSystem={defenseSystem} onTeam={setTeamId} onPlayer={setPlayerId} onType={setType} onAttack={setAttackType} onDefense={setDefenseSystem} onSubmit={saveEvent} />
            <form className="card" onSubmit={addEvent}>
              <h3>Detalhe</h3>
              <div className="stack">
                <select value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
                {type === "SHOT" && <><select value={z} onChange={(e) => setZ(e.target.value)}>{ZONES.map((x) => <option key={x}>{x}</option>)}</select><select value={b} onChange={(e) => setB(e.target.value)}>{BOXES.map((x) => <option key={x}>{x}</option>)}</select><select value={result} onChange={(e) => setResult(e.target.value)}>{RESULTS.map((x) => <option key={x}>{x}</option>)}</select></>}
                <select value={playerId} onChange={(e) => setPlayerId(e.target.value)}><option value="">Atleta</option>{roster.map((p) => <option key={p.player_id} value={p.player_id}>{p.player_name}</option>)}</select>
                <button type="submit">Registar</button>
              </div>
            </form>
          </div>
          <StatsPanel events={events} homeId={match.home_team_id} awayId={match.away_team_id} homeName={match.home_team_name} awayName={match.away_team_name} onPick={setFilter} />
          {filter && <button type="button" onClick={() => setFilter(null)}>Ver tudo</button>}
          <TimelinePanel events={shown} stints={filter ? [] : stints} players={players} hideStints={!!filter} />
        </>
      )}
    </div>
  );
}
