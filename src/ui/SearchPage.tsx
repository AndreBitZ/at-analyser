import { useState } from "react";
import { get } from "./adminApi";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<any>(null);
  async function go() {
    setRes(await get(`/search?q=${encodeURIComponent(q)}`));
  }
  return (
    <div>
      <h2>Pesquisa</h2>
      <div className="card">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Atleta, clube, jogo, watchlist" />
        <button type="button" onClick={go} style={{ marginTop: 8 }}>Procurar</button>
      </div>
      {res && (
        <>
          <h3>Atletas</h3>
          <ul>{res.players.map((p: any) => <li key={p.id}>{p.name} · {p.primary_position}</li>)}</ul>
          <h3>Clubes</h3>
          <ul>{res.clubs.map((c: any) => <li key={c.id}>{c.name}</li>)}</ul>
          <h3>Jogos</h3>
          <ul>{res.matches.map((m: any) => <li key={m.id}>{m.home} vs {m.away}</li>)}</ul>
          <h3>Watchlist</h3>
          <ul>{res.watch.map((w: any) => <li key={w.id}>{w.player_name} · {w.status}</li>)}</ul>
        </>
      )}
    </div>
  );
}
