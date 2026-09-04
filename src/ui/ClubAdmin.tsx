import { FormEvent, useEffect, useState } from "react";
import { load, save, uid, type Store } from "../data/localStore";
import { canUseFolder, getHandle, pickFolder, readFolder, writeFolder } from "../data/folderSync";
import { api, probeSqlite } from "../data/sqliteApi";

export default function ClubAdmin() {
  const [db, setDb] = useState<Store>(() => load());
  const [mode, setMode] = useState<"sqlite" | "pasta" | "browser">("browser");
  const [msg, setMsg] = useState("");
  const [pasta, setPasta] = useState(false);

  async function reloadSqlite() {
    const [clubs, age_groups, seasons, championships, teams, players, matches] = await Promise.all([
      api("/clubs"), api("/age-groups"), api("/seasons"), api("/championships"), api("/teams"), api("/players"), api("/matches"),
    ]);
    setDb({ clubs, age_groups, seasons, championships, teams, championship_teams: [], players, matches });
  }

  useEffect(() => {
    (async () => {
      const h = await probeSqlite();
      if (h?.ok) {
        setMode("sqlite");
        setMsg(`SQLite local (${h.mode}) — data/at-analyser.db`);
        await reloadSqlite();
        return;
      }
      const handle = await getHandle();
      setPasta(Boolean(handle));
      if (handle) setMode("pasta");
    })();
  }, []);

  async function commitLocal(next: Store) {
    save(next);
    setDb(next);
    if (pasta) {
      try { await writeFolder(next); setMsg("Guardado na pasta"); } catch (e: any) { setMsg(e.message); }
    }
  }

  async function post(path: string, body: object) {
    if (mode === "sqlite") {
      await api(path, { method: "POST", body: JSON.stringify(body) });
      await reloadSqlite();
      setMsg("Guardado no SQLite");
      return;
    }
  }

  async function escolherPasta() {
    await pickFolder();
    setPasta(true);
    setMode("pasta");
    const remote = await readFolder();
    if (remote) { save(remote); setDb({ ...load(), ...remote }); }
    else await writeFolder(load());
    setMsg("Pasta ligada");
  }

  return (
    <div>
      <div className="card">
        <h3>Base de dados</h3>
        <p className="muted">
          {mode === "sqlite" && "A usar SQLite no PC. Corre npm run server (ficheiro data/at-analyser.db)."}
          {mode === "pasta" && "A usar pasta com JSON. Para SQLite: noutra janela corre npm run server e recarrega."}
          {mode === "browser" && "A usar o browser. No PC: npm run server + npm run dev para SQLite real."}
        </p>
        {canUseFolder() && mode !== "sqlite" && (
          <button type="button" onClick={escolherPasta}>{pasta ? "Mudar pasta JSON" : "Escolher pasta JSON"}</button>
        )}
        {msg && <p className="muted">{msg}</p>}
      </div>

      <div className="grid" style={{ marginTop: 16 }}>
        <FormCard title="Clube" onSubmit={(fd) => mode === "sqlite" ? post("/clubs", fd) : commitLocal({ ...db, clubs: [...db.clubs, { id: uid("club"), ...fd }] })}>
          <input name="name" placeholder="Nome do clube" required />
          <input name="city" placeholder="Cidade" />
        </FormCard>
        <FormCard title="Escalão" onSubmit={(fd) => mode === "sqlite" ? post("/age-groups", fd) : commitLocal({ ...db, age_groups: [...db.age_groups, { id: uid("ag"), ...fd }] })}>
          <Select name="club_id" options={db.clubs} labelKey="name" />
          <input name="code" placeholder="SUB14F" required />
          <input name="name" placeholder="Sub-14 feminino" required />
        </FormCard>
        <FormCard title="Época" onSubmit={(fd) => mode === "sqlite" ? post("/seasons", fd) : commitLocal({ ...db, seasons: [...db.seasons, { id: uid("szn"), label: fd.label }] })}>
          <input name="label" placeholder="2025/26" required />
        </FormCard>
        <FormCard title="Campeonato" onSubmit={(fd) => mode === "sqlite" ? post("/championships", fd) : commitLocal({ ...db, championships: [...db.championships, { id: uid("cmp"), ...fd }] })}>
          <Select name="season_id" options={db.seasons} labelKey="label" />
          <input name="name" placeholder="Nome" required />
        </FormCard>
        <FormCard title="Equipa" onSubmit={(fd) => mode === "sqlite" ? post("/teams", fd) : commitLocal({ ...db, teams: [...db.teams, { id: uid("tm"), ...fd }] })}>
          <Select name="club_id" options={db.clubs} labelKey="name" />
          <Select name="age_group_id" options={db.age_groups} labelKey="name" />
          <input name="name" placeholder="Nome da equipa" required />
        </FormCard>
        <FormCard title="Jogadora (2 escalões)" onSubmit={(fd) => mode === "sqlite" ? post("/players", { ...fd, age_group_ids: [fd.age_group_id, fd.age_group_id_2].filter(Boolean), is_goalkeeper: fd.primary_position === "GK" }) : commitLocal({ ...db, players: [...db.players, { id: uid("pl"), ...fd, age_groups: [fd.age_group_id, fd.age_group_id_2].filter(Boolean) }] })}>
          <Select name="club_id" options={db.clubs} labelKey="name" />
          <input name="name" placeholder="Nome" required />
          <select name="primary_position" defaultValue="CB">{["LW","LB","CB","RB","RW","PV","GK"].map((p) => <option key={p}>{p}</option>)}</select>
          <Select name="age_group_id" options={db.age_groups} labelKey="name" />
          <Select name="age_group_id_2" options={db.age_groups} labelKey="name" allowEmpty placeholder="2.º escalão" />
        </FormCard>
        <FormCard title="Jogo" onSubmit={(fd) => mode === "sqlite" ? post("/matches", fd) : commitLocal({ ...db, matches: [...db.matches, { id: uid("mt"), ...fd }] })}>
          <Select name="championship_id" options={db.championships} labelKey="name" allowEmpty />
          <Select name="home_team_id" options={db.teams} labelKey="name" />
          <Select name="away_team_id" options={db.teams} labelKey="name" />
        </FormCard>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Jogadoras</h3>
        <table><thead><tr><th>Nome</th><th>Escalões</th></tr></thead>
        <tbody>{db.players.map((p) => <tr key={p.id}><td>{p.name}</td><td>{Array.isArray(p.age_groups) ? p.age_groups.map((g: any) => g.code || db.age_groups.find((x) => x.id === g)?.code).filter(Boolean).join(" · ") : "—"}</td></tr>)}</tbody></table>
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
