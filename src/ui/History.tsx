import { useEffect, useState } from "react";
import { get } from "./adminApi";

export function MatchHistory({ title, path }: { title: string; path: string | null }) {
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => {
    if (!path) { setRows(null); return; }
    get(path).then(setRows).catch(() => setRows([]));
  }, [path]);
  if (!path) return <p className="muted">Escolhe um registo na tabela (Ver jogos).</p>;
  if (!rows) return <p className="muted">A carregar calendário…</p>;
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3>{title} ({rows.length})</h3>
      {rows.length === 0 ? <p className="muted">Ainda não há jogos.</p> : (
        <table>
          <thead><tr><th>Data</th><th>Casa</th><th>Fora</th><th>Campeonato</th><th>Época</th><th>Local</th></tr></thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td>{m.kickoff_iso ? String(m.kickoff_iso).replace("T", " ") : "—"}</td>
                <td>{m.home_team_name}</td>
                <td>{m.away_team_name}</td>
                <td>{m.championship_name || "—"}</td>
                <td>{m.season_label || "—"}</td>
                <td>{m.venue || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
