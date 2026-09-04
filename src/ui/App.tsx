import { useMemo, useState } from "react";
import { sampleDataset } from "../data/sample";
import {
  formatBox,
  fieldHeat,
  goalHeat,
  matrixZXB,
  playerScorecard,
  teamBoxScore,
  teamShots,
} from "../domain/stats";
import { dash } from "../domain/formulas";
import { FIELD_ZONE_LABELS, GOAL_ZONE_LABELS, FIELD_ZONES, GOAL_ZONES } from "../domain/zones";
import { derivedFilters, formatClock } from "../domain/time";
import type { Player } from "../domain/types";
import ClubAdmin from "./ClubAdmin";

type Tab = "clube" | "jogo" | "equipa" | "atletas" | "heat" | "video";

export default function App() {
  const { match, teams, players, stints, events } = sampleDataset;
  const [tab, setTab] = useState<Tab>("clube");
  const [playerId, setPlayerId] = useState(players[0].player_id);
  const [teamId, setTeamId] = useState(match.home_team_id);
  const homeBox = useMemo(() => formatBox(teamBoxScore(events, match.home_team_id)), [events, match]);
  const awayBox = useMemo(() => formatBox(teamBoxScore(events, match.away_team_id)), [events, match]);
  const player = players.find((p) => p.player_id === playerId)!;
  const card = useMemo(() => playerScorecard(player, events, stints, match), [player, events, stints, match]);
  const shots = teamShots(events, teamId);
  const fHeat = fieldHeat(shots);
  const gHeat = goalHeat(shots);
  const matrix = matrixZXB(shots);
  return (
    <div className="app">
      <header>
        <h1>AT Analyser</h1>
        <p>Análise de andebol · clube, épocas e performance · IIJ</p>
      </header>
      <div className="tabs">
        {([["clube", "Clube"], ["jogo", "Jogo"], ["equipa", "Equipas"], ["atletas", "Scorecards"], ["heat", "Heat maps"], ["video", "Linha de eventos"]] as const).map(([id, label]) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      {tab === "clube" && <ClubAdmin />}
      {tab === "jogo" && <div className="grid"><div className="card"><h3>Amostra</h3><div className="stat">{homeBox.goals_scored} — {awayBox.goals_scored}</div></div><div className="card"><DemoFilters /></div></div>}
      {tab === "equipa" && <div className="grid"><TeamCard name={teams[0].name} box={homeBox} /><TeamCard name={teams[1].name} box={awayBox} /></div>}
      {tab === "atletas" && (<><select value={playerId} onChange={(e) => setPlayerId(e.target.value)}>{players.map((p) => <option key={p.player_id} value={p.player_id}>{p.name}</option>)}</select><Scorecard card={card} /></>)}
      {tab === "heat" && (<><select value={teamId} onChange={(e) => setTeamId(e.target.value)}>{teams.map((t) => <option key={t.team_id} value={t.team_id}>{t.name}</option>)}</select><div className="grid" style={{ marginTop: 12 }}><div className="card"><h3>Z1–Z9</h3><div className="heat field">{fHeat.map((c) => <div className="cell" key={c.zone} title={FIELD_ZONE_LABELS[c.zone]}><strong>{c.zone}</strong>{c.volume} · {dash(c.efficiency)}%</div>)}</div></div><div className="card"><h3>B1–B9</h3><div className="heat goal">{gHeat.map((c) => <div className="cell" key={c.zone} title={GOAL_ZONE_LABELS[c.zone]}><strong>{c.zone}</strong>{dash(c.efficiency)}%</div>)}</div></div></div><div className="card matrix" style={{ marginTop: 12 }}><table><thead><tr><th></th>{GOAL_ZONES.map((b) => <th key={b}>{b}</th>)}</tr></thead><tbody>{FIELD_ZONES.map((z) => <tr key={z}><th>{z}</th>{GOAL_ZONES.map((b) => { const cell = matrix[`${z}-${b}`]; return <td key={b}>{cell.shots ? `${cell.goals}/${cell.onTarget}` : "—"}</td>; })}</tr>)}</tbody></table></div></>)}
      {tab === "video" && <div className="card timeline"><table><thead><tr><th>Relógio</th><th>Bloco</th><th>Tipo</th><th>Jogadora</th></tr></thead><tbody>{events.map((e) => { const p: Player | undefined = players.find((x) => x.player_id === e.player_id); return <tr key={e.event_id}><td>{formatClock(e.timestamp_seconds)}</td><td>{e.context.five_minute_block}</td><td>{e.type}</td><td>{p?.name ?? "—"}</td></tr>; })}</tbody></table></div>}
    </div>
  );
}
function DemoFilters() {
  const { match } = sampleDataset;
  const f = derivedFilters(3050, 1, match);
  return <p className="muted">Crunchtime aos 50:50 com Δ=1: {f.CRUNCHTIME ? "sim" : "não"}</p>;
}
function TeamCard({ name, box }: { name: string; box: ReturnType<typeof formatBox> }) {
  return <div className="card"><h3>{name}</h3><div className="stat">{box.goals_scored} / {box.goals_conceded}</div></div>;
}
function Scorecard({ card }: { card: ReturnType<typeof playerScorecard> }) {
  return <div className="card"><h3>{card.player.name}</h3><p>{card.narrative}</p><p className="note">{card.note_balance}</p></div>;
}
