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

type Tab = "jogo" | "equipa" | "atletas" | "heat" | "video";

export default function App() {
  const { match, teams, players, stints, events } = sampleDataset;
  const [tab, setTab] = useState<Tab>("jogo");
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
        <p>
          Análise de vídeo e performance de andebol · {teams[0].name} vs {teams[1].name} · blocos de 5 min · IIJ
        </p>
      </header>
      <div className="tabs">
        {(
          [
            ["jogo", "Jogo"],
            ["equipa", "Equipas"],
            ["atletas", "Scorecards"],
            ["heat", "Heat maps"],
            ["video", "Linha de eventos"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "jogo" && (
        <div className="grid">
          <div className="card">
            <h3>Estrutura</h3>
            <div>match_id: {match.match_id}</div>
            <div>home_team_id: {match.home_team_id}</div>
            <div>away_team_id: {match.away_team_id}</div>
          </div>
          <div className="card">
            <h3>Marcador (amostra)</h3>
            <div className="stat">
              {homeBox.goals_scored} — {awayBox.goals_scored}
            </div>
          </div>
          <div className="card">
            <h3>Filtros temporais</h3>
            <p className="muted">Índice = floor(t / 300). Crunchtime: t ≥ 3000 e |Δ| ≤ 2.</p>
            <DemoFilters />
          </div>
        </div>
      )}

      {tab === "equipa" && (
        <div className="grid">
          <TeamCard name={teams[0].name} box={homeBox} />
          <TeamCard name={teams[1].name} box={awayBox} />
        </div>
      )}

      {tab === "atletas" && (
        <>
          <div className="row">
            <label>
              Atleta{" "}
              <select value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
                {players.map((p) => (
                  <option key={p.player_id} value={p.player_id}>
                    {p.number} {p.name} ({p.primary_position})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Scorecard card={card} />
        </>
      )}

      {tab === "heat" && (
        <>
          <div className="row">
            <label>
              Equipa{" "}
              <select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                {teams.map((t) => (
                  <option key={t.team_id} value={t.team_id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid">
            <div className="card">
              <h3>Campo Z1–Z9</h3>
              <div className="heat field">
                {fHeat.map((c) => (
                  <div className="cell" key={c.zone} title={FIELD_ZONE_LABELS[c.zone]}>
                    <strong>{c.zone}</strong>
                    {c.volume} rem · {c.goals} G · {dash(c.efficiency)}%
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3>Baliza B1–B9</h3>
              <div className="heat goal">
                {gHeat.map((c) => (
                  <div className="cell" key={c.zone} title={GOAL_ZONE_LABELS[c.zone]}>
                    <strong>{c.zone}</strong>
                    {c.on_target} enc · {c.goals} G · {dash(c.efficiency)}%
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="card matrix" style={{ marginTop: 12 }}>
            <h3>Matriz origem → destino</h3>
            <table>
              <thead>
                <tr>
                  <th></th>
                  {GOAL_ZONES.map((b) => (
                    <th key={b}>{b}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FIELD_ZONES.map((z) => (
                  <tr key={z}>
                    <th>{z}</th>
                    {GOAL_ZONES.map((b) => {
                      const cell = matrix[`${z}-${b}`];
                      return <td key={b}>{cell.shots ? `${cell.goals}/${cell.onTarget}` : "—"}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "video" && (
        <div className="card timeline">
          <h3>Eventos</h3>
          <table>
            <thead>
              <tr>
                <th>Relógio</th>
                <th>Bloco</th>
                <th>Tipo</th>
                <th>Jogadora</th>
                <th>Zona</th>
                <th>Contexto</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => {
                const p: Player | undefined = players.find((x) => x.player_id === e.player_id);
                return (
                  <tr key={e.event_id}>
                    <td>{formatClock(e.timestamp_seconds)}</td>
                    <td>{e.context.five_minute_block}</td>
                    <td>
                      {e.type}
                      {e.shot ? ` / ${e.shot.shot_result}` : ""}
                    </td>
                    <td>{p?.name ?? "—"}</td>
                    <td>{e.shot ? `${e.shot.field_shot_zone}→${e.shot.goal_target_zone ?? "∅"}` : "—"}</td>
                    <td>
                      <span className="tag">{e.context.game_state}</span>
                      <span className="tag">{e.context.numerical_context}</span>
                      <span className="tag">{e.context.passive_context}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DemoFilters() {
  const { match } = sampleDataset;
  const examples = [
    { t: 120, d: 0 },
    { t: 3050, d: 1 },
    { t: 3480, d: 4 },
  ];
  return (
    <table>
      <thead>
        <tr>
          <th>t</th>
          <th>1ª</th>
          <th>2ª</th>
          <th>últ.15</th>
          <th>crunch</th>
        </tr>
      </thead>
      <tbody>
        {examples.map((ex) => {
          const f = derivedFilters(ex.t, ex.d, match);
          return (
            <tr key={ex.t}>
              <td>{formatClock(ex.t)}</td>
              <td>{f.FIRST_HALF ? "sim" : ""}</td>
              <td>{f.SECOND_HALF ? "sim" : ""}</td>
              <td>{f.LAST_15_MINUTES ? "sim" : ""}</td>
              <td>{f.CRUNCHTIME ? "sim" : ""}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function TeamCard({ name, box }: { name: string; box: ReturnType<typeof formatBox> }) {
  return (
    <div className="card">
      <h3>{name}</h3>
      <div className="stat">
        {box.goals_scored} / {box.goals_conceded}
      </div>
      <p className="muted">
        eficácia {box.shot_efficiency_label}% · defesa {box.save_rate_label}%
      </p>
      <p>
        Remates {box.shots} · enc. {box.shots_on_target} · assist. {box.assists} · perdas {box.turnovers}
      </p>
      <p>
        Roubos {box.steals} · blocos {box.defensive_blocks} · 2' {box.two_min_received}
      </p>
    </div>
  );
}

function Scorecard({ card }: { card: ReturnType<typeof playerScorecard> }) {
  return (
    <div className="grid">
      <div className="card">
        <h3>
          {card.player.name} · {card.player.primary_position}
        </h3>
        <div className="stat">{dash(card.minutes)} min</div>
        <p className="muted">
          utilização {dash(card.usage)}% · {dash(card.actions_per_10min)} ações/10 min
        </p>
        <p>
          Remates {card.shots.total_shots} · golos {card.shots.goals} · eficácia {dash(card.shots.shot_efficiency)}%
        </p>
        {card.iij && (
          <p>
            IIJ {dash(card.iij.IIJ_raw, 2)} · IIJ/10 min {dash(card.iij.IIJ_per_10min, 2)}
          </p>
        )}
        {card.gk && (
          <p>
            Score GR {dash(card.gk.score, 1)} · defesas {card.gk.saves}
          </p>
        )}
        <p>
          Saldo em campo {card.balance.on_court_goal_difference} (
          {dash(card.balance.on_court_goal_difference_per_10min)} /10 min)
        </p>
        <p className="note">{card.note_balance}</p>
      </div>
      <div className="card">
        <h3>Perfil</h3>
        <p className="narrative">{card.narrative}</p>
        <p className="muted">Fiabilidade: {card.reliability}</p>
      </div>
    </div>
  );
}
