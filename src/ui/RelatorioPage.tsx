import { useEffect, useState } from "react";
import { get } from "./adminApi";
import { BoxHeat, ZoneHeat } from "./HeatMap";

function briefing(name: string, r: any) {
  const topZ = Object.entries(r.zones || {}).sort((a: any, b: any) => b[1] - a[1])[0];
  const topB = Object.entries(r.boxes || {}).sort((a: any, b: any) => b[1] - a[1])[0];
  const sys = Object.entries(r.systems || {}).sort((a: any, b: any) => b[1] - a[1])[0];
  const att = Object.entries(r.attacks || {}).sort((a: any, b: any) => b[1] - a[1])[0];
  const fiab = r.shots >= 40 ? "boa" : r.shots >= 15 ? "média" : "baixa";
  return `Em ${r.matches} jogo(s), ${name} rematou ${r.shots} vezes com ${r.pct}% de eficácia. ` +
    (topZ ? `Maior volume em ${topZ[0]}. ` : "") +
    (topB ? `Baliza ${topB[0]}. ` : "") +
    (att ? `Ataque mais marcado: ${att[0]}. ` : "") +
    (sys ? `Defesa mais marcada: ${sys[0]}. ` : "") +
    `Crunch: ${r.crunchGoals} golos. 7×6: ${r.seven6}. Fiabilidade ${fiab}.`;
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
            <div><div className="muted">Crunch</div><div className="stat">{rep.crunchGoals}</div></div>
          </div>
          <p className="muted">Ataques: {Object.entries(rep.attacks || {}).map(([k, v]) => `${k}:${v}`).join(" · ") || "—"}</p>
          <p className="muted">Sistemas: {Object.entries(rep.systems || {}).map(([k, v]) => `${k}:${v}`).join(" · ") || "—"}</p>
          <ZoneHeat zones={rep.zones} />
          <BoxHeat boxes={rep.boxes} />
          <button type="button" onClick={() => window.print()}>Imprimir / PDF</button>
        </div>
      )}
    </div>
  );
}
