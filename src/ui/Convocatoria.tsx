import { useEffect, useState } from "react";
import { del, get, post } from "./adminApi";

export default function Convocatoria({ match }: { match: any }) {
  const [players, setPlayers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [squad, setSquad] = useState<any[]>([]);

  async function load() {
    const [ps, ts, sq] = await Promise.all([
      get("/players"), get("/teams"), get(`/match-squads?match_id=${match.id}`),
    ]);
    setPlayers(ps); setTeams(ts); setSquad(sq);
  }
  useEffect(() => { load().catch(() => {}); }, [match.id]);

  const home = teams.find((t) => t.id === match.home_team_id);
  const away = teams.find((t) => t.id === match.away_team_id);

  function pool(team: any) {
    if (!team) return [];
    return players.filter((p) => p.club_id === team.club_id);
  }
  function onSquad(playerId: string) {
    return squad.some((s) => s.player_id === playerId);
  }

  async function toggle(teamId: string, playerId: string, starter: boolean) {
    if (onSquad(playerId)) await del(`/match-squads/${match.id}/${playerId}`);
    else await post("/match-squads", { match_id: match.id, team_id: teamId, player_id: playerId, starter });
    await load();
  }

  function side(team: any, label: string) {
    if (!team) return null;
    return (
      <div className="card">
        <h3>{label} — {team.name}</h3>
        <table>
          <thead><tr><th>Conv.</th><th>Tit.</th><th>Atleta</th><th>Pos.</th></tr></thead>
          <tbody>
            {pool(team).map((p) => {
              const row = squad.find((s) => s.player_id === p.id);
              return (
                <tr key={p.id}>
                  <td><input type="checkbox" checked={!!row} onChange={() => toggle(team.id, p.id, false)} /></td>
                  <td><input type="checkbox" checked={!!row?.starter} disabled={!row} onChange={() => post("/match-squads", { match_id: match.id, team_id: team.id, player_id: p.id, starter: !row?.starter }).then(load)} /></td>
                  <td>{p.name}</td>
                  <td>{p.primary_position}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!pool(team).length && <p className="muted">Não há atletas neste clube. Cria-as em Atletas.</p>}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      <h3>Convocatória</h3>
      <p className="muted">Marca as convocadas de cada lado. As titulares começam em campo na ficha (podes corrigir lá o tempo).</p>
      <div className="grid">
        {side(home, "Casa")}
        {side(away, "Fora")}
      </div>
    </div>
  );
}
