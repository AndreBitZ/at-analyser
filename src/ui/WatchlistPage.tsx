import { FormEvent, useEffect, useState } from "react";
import { del, get, post } from "./adminApi";

export default function WatchlistPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const load = async () => {
    setRows(await get("/watchlist"));
    setPlayers(await get("/players"));
  };
  useEffect(() => { load().catch(() => {}); }, []);

  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await post("/watchlist", {
      player_id: String(fd.get("player_id")),
      status: String(fd.get("status") || "SEGUIR"),
      rating: Number(fd.get("rating") || 3),
      attack_note: String(fd.get("attack_note") || ""),
      defense_note: String(fd.get("defense_note") || ""),
      read_note: String(fd.get("read_note") || ""),
      clips: String(fd.get("clips") || ""),
    });
    e.currentTarget.reset();
    await load();
  }

  return (
    <div>
      <h2>Watchlist de scout</h2>
      <p className="muted">Atletas a seguir. Notas qualitativas + ligação a clips na pasta local.</p>
      <form className="card" onSubmit={add} style={{ marginBottom: 16 }}>
        <h3>Adicionar</h3>
        <div className="stack">
          <select name="player_id" required>
            <option value="">Atleta</option>
            {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select name="status"><option>SEGUIR</option><option>PRIORIDADE</option><option>ARQUIVAR</option></select>
          <select name="rating"><option>1</option><option>2</option><option value="3">3</option><option>4</option><option>5</option></select>
          <input name="attack_note" placeholder="Ataque" />
          <input name="defense_note" placeholder="Defesa" />
          <input name="read_note" placeholder="Leitura de jogo" />
          <input name="clips" placeholder="clips/nome-pasta ou URLs" />
          <button type="submit">Guardar</button>
        </div>
      </form>
      <table>
        <thead><tr><th>Atleta</th><th>Clube</th><th>Estado</th><th>Nota</th><th>Ataque</th><th>Defesa</th><th>Clips</th><th></th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.player_name}</td><td>{r.club_name || "—"}</td><td>{r.status}</td><td>{r.rating}</td>
              <td>{r.attack_note || "—"}</td><td>{r.defense_note || "—"}</td><td>{r.clips || "—"}</td>
              <td><button type="button" onClick={() => del(`/watchlist/${r.id}`).then(load)}>Tirar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
