import { FormEvent, useEffect, useState } from "react";
import { api, probeSqlite } from "../data/sqliteApi";

type Box = Record<string, any[]>;

export default function ClubAdmin() {
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [db, setDb] = useState<Box>({
    clubs: [], age_groups: [], seasons: [], championships: [], teams: [], players: [], matches: [],
  });

  async function reload() {
    const health = await probeSqlite();
    if (!health?.ok) {
      setOk(false);
      setErr("Servidor SQLite desligado. No PC corre: npm run server");
      return;
    }
    setOk(true);
    setErr(null);
    const [clubs, age_groups, seasons, championships, teams, players, matches] = await Promise.all([
      api("/clubs"), api("/age-groups"), api("/seasons"), api("/championships"), api("/teams"), api("/players"), api("/matches"),
    ]);
    setDb({ clubs, age_groups, seasons, championships, teams, players, matches });
  }

  useEffect(() => { reload(); }, []);

  async function post(path: string, body: object) {
    await api(path, { method: "POST", body: JSON.stringify(body) });
    await reload();
  }

  if (!ok) {
    return (
      <div className="card">
        <h3>SQLite local</h3>
        <p className="note">{err}</p>
        <p className="muted">Abre um terminal na pasta do projeto e corre <code>npm run server</code>. Depois recarrega esta página. Os dados ficam em <code>data/at-analyser.db</code>.</p>
        <button type="button" onClick={() => reload()}>Tentar outra vez</button>
      </div>
    );
  }

  return (
    <div>
      <p className="muted">A gravar em data/at-analyser.db (só neste PC).</p>
      <div className="grid">
        <FormCard title="Clube" onSubmit={(fd) => post("/clubs", fd)}>
          <input name="name" placeholder="Nome do clube" required />
          <input name="city" placeholder="Cidade" />
        </FormCard>
        <FormCard title="Escalão" onSubmit={(fd) => post("/age-groups", fd)}>
          <Select name="club_id" options={db.clubs} labelKey="name" />
          <input name="code" placeholder="SUB14F" required />
          <input name="name" placeholder="Sub-14 feminino" required />
        </FormCard>
        <FormCard title="Época" onSubmit={(fd) => post("/seasons", fd)}>
          <input name="label" placeholder="2025/26" required />
        </FormCard>
        <FormCard title="Campeonato" onSubmit={(fd) => post("/championships", fd)}>
          <Select name="season_id" options={db.seasons} labelKey="label" />
          <input name="name" placeholder="Nome" required />
        </FormCard>
        <FormCard title="Equipa" onSubmit={(fd) => post("/teams", fd)}>
          <Select name="club_id" options={db.clubs} labelKey="name" />
          <Select name="age_group_id" options={db.age_groups} labelKey="name" />
          <input name="name" placeholder="Nome da equipa" required />
        </FormCard>
        <FormCard title="Inscrever equipa" onSubmit={(fd) => post("/championship-teams", fd)}>
          <Select name="championship_id" options={db.championships} labelKey="name" />
          <Select name="team_id" options={db.teams} labelKey="name" />
        </FormCard>
        <FormCard title="Jogadora (2 escalões)" onSubmit={(fd) => post("/players", { ...fd, age_group_ids: [fd.age_group_id, fd.age_group_id_2].filter(Boolean), is_goalkeeper: fd.primary_position === "GK" })}>
          <Select name="club_id" options={db.clubs} labelKey="name" />
          <input name="name" placeholder="Nome" required />
          <select name="primary_position" defaultValue="CB">{["LW","LB","CB","RB","RW","PV","GK"].map((p) => <option key={p}>{p}</option>)}</select>
          <Select name="age_group_id" options={db.age_groups} labelKey="name" />
          <Select name="age_group_id_2" options={db.age_groups} labelKey="name" allowEmpty placeholder="2.º escalão" />
        </FormCard>
        <FormCard title="Jogo" onSubmit={(fd) => post("/matches", fd)}>
          <Select name="championship_id" options={db.championships} labelKey="name" allowEmpty />
          <Select name="home_team_id" options={db.teams} labelKey="name" />
          <Select name="away_team_id" options={db.teams} labelKey="name" />
        </FormCard>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Jogadoras</h3>
        <table><thead><tr><th>Nome</th><th>Escalões</th></tr></thead>
        <tbody>{db.players.map((p) => <tr key={p.id}><td>{p.name}</td><td>{(p.age_groups || []).map((g: any) => g.code).join(" · ") || "—"}</td></tr>)}</tbody></table>
      </div>
    </div>
  );
}
function Select({ name, options, labelKey, allowEmpty, placeholder }: any) {
  return (
    <select name={name} required={!allowEmpty} defaultValue="">
      <option value="">{placeholder || (allowEmpty ? "—" : "Selecionar")}</option>
      {options.map((o: any) => <option key={o.id} value={o.id}>{o[labelKey]}</option>)}
    </select>
  );
}
function FormCard({ title, children, onSubmit }: any) {
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const fd: Record<string, string> = {};
    form.forEach((v, k) => { fd[k] = String(v); });
    onSubmit(fd);
    e.currentTarget.reset();
  }
  return <form className="card" onSubmit={submit}><h3>{title}</h3><div className="stack">{children}</div><button type="submit" style={{ marginTop: 10 }}>Guardar</button></form>;
}
