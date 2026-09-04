import { useEffect, useState } from "react";
import { get } from "./adminApi";

export default function RelatorioPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [teamId, setTeamId] = useState("");
  const [rep, setRep] = useState<any>(null);
  useEffect(() => { get("/teams").then(setTeams).catch(() => {}); }, []);
  async function load(id: string) {
    setTeamId(id);
    if (!id) { setRep(null); return; }
    setRep(await get(`/opponent-report?team_id=${id}`));
  }
  const team = teams.find((t) => t.id === teamId);
  return (
    <div>
      <h2>Relatório de adversário</h2>
      <p className="muted">Agrega jogos já marcados desta equipa. Imprime / grava PDF pelo browser (Ctrl+P).</p>
      <div className="card" style={{ marginBottom: 12 }}>
        <select value={teamId} onChange={(e) => load(e.target.value)}>
          <option value="">Equipa</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.club_name}</option>)}
        </select>
      </div>
      {rep && (
        <div className="card" id="print-report">
          <h3>{team?.name} — {rep.matches} jogos analisados</h3>
          <div className="grid">
            <div><div className="muted">Remates</div><div className="stat">{rep.shots}</div></div>
            <div><div className="muted">Golos</div><div className="stat">{rep.goals}</div></div>
            <div><div className="muted">Eficácia</div><div className="stat">{rep.pct}%</div></div>
            <div><div className="muted">Golos últimos 10 min</div><div className="stat">{rep.crunchGoals}</div></div>
            <div><div className="muted">Acções 7×6</div><div className="stat">{rep.seven6}</div></div>
            <div><div className="muted">2 min</div><div className="stat">{rep.twoMin}</div></div>
            <div><div className="muted">Perdas</div><div className="stat">{rep.turnovers}</div></div>
          </div>
          <h3>Zonas de remate (Z)</h3>
          <p>{Object.keys(rep.zones).length ? Object.entries(rep.zones).map(([k, v]) => `${k}: ${v}`).join(" · ") : "Sem remates com zona."}</p>
          <h3>Baliza (B)</h3>
          <p>{Object.keys(rep.boxes).length ? Object.entries(rep.boxes).map(([k, v]) => `${k}: ${v}`).join(" · ") : "Sem destinos."}</p>
          <h3>Sistemas defensivos marcados</h3>
          <p>{Object.keys(rep.systems).length ? Object.entries(rep.systems).map(([k, v]) => `${k}: ${v}`).join(" · ") : "Marca defense_system nas notas/contexto (6-0, 5-1, 3-2-1)."}</p>
          <h3>Jogos</h3>
          <table>
            <thead><tr><th>Casa</th><th>Fora</th></tr></thead>
            <tbody>{rep.games.map((g: any) => <tr key={g.id}><td>{g.home_name}</td><td>{g.away_name}</td></tr>)}</tbody>
          </table>
          <p className="muted">Gerado no AT Analyser. Dados locais.</p>
          <button type="button" onClick={() => window.print()}>Imprimir / PDF</button>
        </div>
      )}
    </div>
  );
}
