import { useEffect, useState } from "react";
import { get } from "./adminApi";

function briefing(name: string, r: any) {
  const topZ = Object.entries(r.zones || {}).sort((a: any, b: any) => b[1] - a[1])[0];
  const topB = Object.entries(r.boxes || {}).sort((a: any, b: any) => b[1] - a[1])[0];
  const sys = Object.entries(r.systems || {}).sort((a: any, b: any) => b[1] - a[1])[0];
  const fiab = r.shots >= 40 ? "boa" : r.shots >= 15 ? "média" : "baixa";
  return `Em ${r.matches} jogo(s) analisado(s), ${name} rematou ${r.shots} vezes com ${r.pct}% de eficácia (${r.goals} golos). ` +
    (topZ ? `Maior volume de remate em ${topZ[0]} (${topZ[1]}). ` : "") +
    (topB ? `Destino mais usado na baliza ${topB[0]}. ` : "") +
    (sys ? `Sistema defensivo mais marcado: ${sys[0]}. ` : "Sistema defensivo ainda pouco etiquetado. ") +
    `Golos nos últimos 10 min: ${r.crunchGoals}. Acções em 7×6: ${r.seven6}. Perdas: ${r.turnovers}. 2 min: ${r.twoMin}. ` +
    `A leitura tem fiabilidade ${fiab}, com base em ${r.shots} remates — confirmar nos clips.`;
}

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
      <p className="muted">Uma página para o treinador. Imprime / PDF com Ctrl+P.</p>
      <div className="card" style={{ marginBottom: 12 }}>
        <select value={teamId} onChange={(e) => load(e.target.value)}>
          <option value="">Equipa</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.club_name}</option>)}
        </select>
      </div>
      {rep && (
        <div className="card" id="print-report">
          <h3>{team?.name} — {rep.matches} jogos</h3>
          <p>{briefing(team?.name || "A equipa", rep)}</p>
          <div className="grid">
            <div><div className="muted">Remates</div><div className="stat">{rep.shots}</div></div>
            <div><div className="muted">Golos</div><div className="stat">{rep.goals}</div></div>
            <div><div className="muted">Eficácia</div><div className="stat">{rep.pct}%</div></div>
            <div><div className="muted">Crunch 10 min</div><div className="stat">{rep.crunchGoals}</div></div>
            <div><div className="muted">7×6</div><div className="stat">{rep.seven6}</div></div>
            <div><div className="muted">2 min</div><div className="stat">{rep.twoMin}</div></div>
          </div>
          <h3>Zonas Z</h3>
          <p>{Object.keys(rep.zones).length ? Object.entries(rep.zones).map(([k, v]) => `${k}:${v}`).join(" · ") : "—"}</p>
          <h3>Baliza B</h3>
          <p>{Object.keys(rep.boxes).length ? Object.entries(rep.boxes).map(([k, v]) => `${k}:${v}`).join(" · ") : "—"}</p>
          <button type="button" onClick={() => window.print()}>Imprimir / PDF</button>
        </div>
      )}
    </div>
  );
}
