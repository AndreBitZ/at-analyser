import { useEffect, useState } from "react";
import { get } from "./adminApi";
import { BoxHeat, ZoneHeat } from "./HeatMap";

export default function ScorecardPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [id, setId] = useState("");
  const [card, setCard] = useState<any>(null);
  useEffect(() => { get("/players").then(setPlayers).catch(() => {}); }, []);
  async function load(pid: string) {
    setId(pid);
    if (!pid) { setCard(null); return; }
    setCard(await get(`/player-card?player_id=${pid}`));
  }
  const p = players.find((x) => x.id === id);
  return (
    <div>
      <h2>Scorecard</h2>
      <p className="muted">Perfil com base nos jogos marcados. Texto descritivo, não rótulo absoluto.</p>
      <div className="card">
        <select value={id} onChange={(e) => load(e.target.value)}>
          <option value="">Atleta</option>
          {players.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.primary_position}</option>)}
        </select>
      </div>
      {card && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3>{p?.name} {card.is_gk ? "(GR)" : ""}</h3>
          <p>{card.narrative}</p>
          <div className="grid">
            <div><div className="muted">Jogos</div><div className="stat">{card.matches}</div></div>
            <div><div className="muted">Minutos</div><div className="stat">{card.minutes}</div></div>
            <div><div className="muted">Acções / 10 min</div><div className="stat">{card.per10}</div></div>
            <div><div className="muted">Remates</div><div className="stat">{card.shots}</div></div>
            <div><div className="muted">Golos</div><div className="stat">{card.goals}</div></div>
            <div><div className="muted">Eficácia</div><div className="stat">{card.pct}%</div></div>
            <div><div className="muted">Fiabilidade</div><div className="stat">{card.reliability}</div></div>
          </div>
          <ZoneHeat zones={card.zones} />
          <BoxHeat boxes={card.boxes} />
        </div>
      )}
    </div>
  );
}
