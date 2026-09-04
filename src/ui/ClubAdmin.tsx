import { FormEvent, useEffect, useState } from "react";

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`/api${path}`, { headers: { "Content-Type": "application/json" }, ...init });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export default function ClubAdmin() {
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState("…");
  const [clubs, setClubs] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [champs, setChamps] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);

  async function reload() {
    try {
      setError(null);
      setHealth((await api("/health")).mode);
      setClubs(await api("/clubs"));
      setGroups(await api("/age-groups"));
      setSeasons(await api("/seasons"));
      setChamps(await api("/championships"));
      setTeams(await api("/teams"));
      setPlayers(await api("/players"));
      setMatches(await api("/matches"));
    } catch (e: any) {
      setError(e.message);
      setHealth("indisponível");
    }
  }
  useEffect(() => { reload(); }, []);

  return (
    <div>
      <p className="muted">
        Base: {health}. No PC: <code>npm run server</code> → <code>data/at-analyser.db</code>. Na Vercel: Turso.
      </p>
      {error && <p className="note">{error}</p>}
      <div className="grid">
        <FormCard title="Clube" onSubmit={(fd) => api("/clubs", { method: "POST", body: JSON.stringify({ name: fd.name, city: fd.city }) }).then(reload)}>
          <input name="name" placeholder="Nome do clube" required />
          <input name="city" placeholder="Cidade" />
        </FormCard>
        <FormCard title="Escalão" onSubmit={(fd) => api("/age-groups", { method: "POST", body: JSON.stringify({ club_id: fd.club_id, code: fd.code, name: fd.name, gender: fd.gender }) }).then(reload)}>
          <Select name="club_id" options={clubs} labelKey="name" />
          <input name="code" placeholder="SUB14F" required />
          <input name="name" placeholder="Sub-14 feminino" required />
          <select name="gender" defaultValue="F"><option value="F">Feminino</option><option value="M">Masculino</option><option value="X">Misto</option></select>
        </FormCard>
        <FormCard title="Época" onSubmit={(fd) => api("/seasons", { method: "POST", body: JSON.stringify({ label: fd.label, start_date: fd.start_date, end_date: fd.end_date }) }).then(reload)}>
          <input name="label" placeholder="2025/26" required />
          <input name="start_date" type="date" />
          <input name="end_date" type="date" />
        </FormCard>
        <FormCard title="Campeonato" onSubmit={(fd) => api("/championships", { method: "POST", body: JSON.stringify({ season_id: fd.season_id, age_group_id: fd.age_group_id || null, name: fd.name, organizer: fd.organizer }) }).then(reload)}>
          <Select name="season_id" options={seasons} labelKey="label" />
          <Select name="age_group_id" options={groups} labelKey="name" allowEmpty />
          <input name="name" placeholder="Nome do campeonato" required />
          <input name="organizer" placeholder="Organizador" />
        </FormCard>
        <FormCard title="Equipa" onSubmit={(fd) => api("/teams", { method: "POST", body: JSON.stringify({ club_id: fd.club_id, age_group_id: fd.age_group_id, name: fd.name, short_name: fd.short_name }) }).then(reload)}>
          <Select name="club_id" options={clubs} labelKey="name" />
          <Select name="age_group_id" options={groups} labelKey="name" />
          <input name="name" placeholder="Nome da equipa" required />
          <input name="short_name" placeholder="Sigla" />
        </FormCard>
        <FormCard title="Inscrever equipa no campeonato" onSubmit={(fd) => api("/championship-teams", { method: "POST", body: JSON.stringify({ championship_id: fd.championship_id, team_id: fd.team_id }) }).then(reload)}>
          <Select name="championship_id" options={champs} labelKey="name" />
          <Select name="team_id" options={teams} labelKey="name" />
        </FormCard>
        <FormCard title="Jogadora (até 2 escalões)" onSubmit={(fd) => api("/players", { method: "POST", body: JSON.stringify({ club_id: fd.club_id, name: fd.name, shirt_number: fd.shirt_number ? Number(fd.shirt_number) : null, birth_year: fd.birth_year ? Number(fd.birth_year) : null, primary_position: fd.primary_position, is_goalkeeper: fd.primary_position === "GK", age_group_ids: [fd.age_group_id, fd.age_group_id_2].filter(Boolean) }) }).then(reload)}>
          <Select name="club_id" options={clubs} labelKey="name" />
          <input name="name" placeholder="Nome" required />
          <input name="shirt_number" type="number" placeholder="Nº" />
          <input name="birth_year" type="number" placeholder="Ano nascimento" />
          <select name="primary_position" defaultValue="CB">{["LW","LB","CB","RB","RW","PV","GK"].map((p) => <option key={p}>{p}</option>)}</select>
          <Select name="age_group_id" options={groups} labelKey="name" />
          <Select name="age_group_id_2" options={groups} labelKey="name" allowEmpty placeholder="2.º escalão (opcional)" />
        </FormCard>
        <FormCard title="Jogo" onSubmit={(fd) => api("/matches", { method: "POST", body: JSON.stringify({ championship_id: fd.championship_id || null, season_id: fd.season_id || null, home_team_id: fd.home_team_id, away_team_id: fd.away_team_id, kickoff_iso: fd.kickoff_iso || null, venue: fd.venue }) }).then(reload)}>
          <Select name="season_id" options={seasons} labelKey="label" allowEmpty />
          <Select name="championship_id" options={champs} labelKey="name" allowEmpty />
          <Select name="home_team_id" options={teams} labelKey="name" />
          <Select name="away_team_id" options={teams} labelKey="name" />
          <input name="kickoff_iso" type="datetime-local" />
          <input name="venue" placeholder="Pavilhão" />
        </FormCard>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Jogadoras e escalões</h3>
        <table><thead><tr><th>Nome</th><th>Nº</th><th>Pos.</th><th>Escalões</th></tr></thead>
          <tbody>{players.map((p) => <tr key={p.id}><td>{p.name}</td><td>{p.shirt_number ?? "—"}</td><td>{p.primary_position}</td><td>{(p.age_groups || []).map((g: any) => g.code).join(" · ") || "—"}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <h3>Jogos</h3>
        <table><thead><tr><th>Época</th><th>Campeonato</th><th>Casa</th><th>Fora</th><th>Data</th></tr></thead>
          <tbody>{matches.map((m) => <tr key={m.id}><td>{m.season_label ?? "—"}</td><td>{m.championship_name ?? "—"}</td><td>{m.home_team_name}</td><td>{m.away_team_name}</td><td>{m.kickoff_iso ?? "—"}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

function Select({ name, options, labelKey, allowEmpty, placeholder }: { name: string; options: any[]; labelKey: string; allowEmpty?: boolean; placeholder?: string }) {
  return (
    <select name={name} required={!allowEmpty} defaultValue="">
      <option value="">{placeholder || (allowEmpty ? "—" : "Selecionar")}</option>
      {options.map((o) => <option key={o.id} value={o.id}>{o[labelKey]}</option>)}
    </select>
  );
}

function FormCard({ title, children, onSubmit }: { title: string; children: React.ReactNode; onSubmit: (fd: Record<string, string>) => Promise<unknown> }) {
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const fd: Record<string, string> = {};
    form.forEach((v, k) => { fd[k] = String(v); });
    setBusy(true);
    try { await onSubmit(fd); e.currentTarget.reset(); } finally { setBusy(false); }
  }
  return (
    <form className="card" onSubmit={submit}>
      <h3>{title}</h3>
      <div className="stack">{children}</div>
      <button type="submit" disabled={busy} style={{ marginTop: 10 }}>{busy ? "A gravar…" : "Guardar"}</button>
    </form>
  );
}
