import { FormEvent, useEffect, useState } from "react";
import { load, save, uid, type Store } from "../data/localStore";
import { canUseFolder, getHandle, pickFolder, readFolder, writeFolder } from "../data/folderSync";

export default function ClubAdmin() {
  const [db, setDb] = useState<Store>(() => load());
  const [pasta, setPasta] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getHandle().then((h) => setPasta(Boolean(h)));
  }, []);

  async function commit(next: Store) {
    save(next);
    setDb(next);
    if (pasta) {
      try {
        await writeFolder(next);
        setMsg("Guardado na pasta do PC");
      } catch (e: any) {
        setMsg(e.message);
      }
    }
  }

  async function escolherPasta() {
    try {
      await pickFolder();
      setPasta(true);
      const remote = await readFolder();
      if (remote && (remote.clubs?.length || remote.players?.length)) {
        const merged = { ...load(), ...remote };
        save(merged);
        setDb(merged);
        setMsg("Pasta ligada. Dados lidos do ficheiro.");
      } else {
        await writeFolder(load());
        setMsg("Pasta ligada. Criado at-analyser-db.json.");
      }
    } catch (e: any) {
      if (e.name !== "AbortError") setMsg(e.message);
    }
  }

  return (
    <div>
      <div className="card">
        <h3>Definições — pasta no PC</h3>
        <p className="muted">
          No Chrome ou Edge, escolhe uma pasta (por exemplo Documentos/AT Analyser). A app lê e grava
          o ficheiro at-analyser-db.json nessa pasta. No telemóvel isto não existe.
        </p>
        {canUseFolder() ? (
          <button type="button" onClick={escolherPasta}>
            {pasta ? "Mudar pasta" : "Escolher pasta do PC"}
          </button>
        ) : (
          <p className="note">Abre a app no Chrome ou Edge do computador para escolher a pasta.</p>
        )}
        {msg && <p className="muted">{msg}</p>}
      </div>

      <div className="grid" style={{ marginTop: 16 }}>
        <FormCard title="Clube" onSubmit={(fd) => commit({ ...db, clubs: [...db.clubs, { id: uid("club"), name: fd.name, city: fd.city }] })}>
          <input name="name" placeholder="Nome do clube" required />
          <input name="city" placeholder="Cidade" />
        </FormCard>
        <FormCard title="Escalão" onSubmit={(fd) => commit({ ...db, age_groups: [...db.age_groups, { id: uid("ag"), club_id: fd.club_id, code: fd.code, name: fd.name, gender: fd.gender || "F" }] })}>
          <Select name="club_id" options={db.clubs} labelKey="name" />
          <input name="code" placeholder="SUB14F" required />
          <input name="name" placeholder="Sub-14 feminino" required />
        </FormCard>
        <FormCard title="Época" onSubmit={(fd) => commit({ ...db, seasons: [...db.seasons, { id: uid("szn"), label: fd.label }] })}>
          <input name="label" placeholder="2025/26" required />
        </FormCard>
        <FormCard title="Campeonato" onSubmit={(fd) => commit({ ...db, championships: [...db.championships, { id: uid("cmp"), season_id: fd.season_id, name: fd.name }] })}>
          <Select name="season_id" options={db.seasons} labelKey="label" />
          <input name="name" placeholder="Nome" required />
        </FormCard>
        <FormCard title="Equipa" onSubmit={(fd) => commit({ ...db, teams: [...db.teams, { id: uid("tm"), club_id: fd.club_id, age_group_id: fd.age_group_id, name: fd.name }] })}>
          <Select name="club_id" options={db.clubs} labelKey="name" />
          <Select name="age_group_id" options={db.age_groups} labelKey="name" />
          <input name="name" placeholder="Nome da equipa" required />
        </FormCard>
        <FormCard title="Jogadora (2 escalões)" onSubmit={(fd) => commit({ ...db, players: [...db.players, { id: uid("pl"), club_id: fd.club_id, name: fd.name, shirt_number: fd.shirt_number || null, primary_position: fd.primary_position, age_groups: [fd.age_group_id, fd.age_group_id_2].filter(Boolean) }] })}>
          <Select name="club_id" options={db.clubs} labelKey="name" />
          <input name="name" placeholder="Nome" required />
          <select name="primary_position" defaultValue="CB">{["LW","LB","CB","RB","RW","PV","GK"].map((p) => <option key={p}>{p}</option>)}</select>
          <Select name="age_group_id" options={db.age_groups} labelKey="name" />
          <Select name="age_group_id_2" options={db.age_groups} labelKey="name" allowEmpty placeholder="2.º escalão" />
        </FormCard>
        <FormCard title="Jogo" onSubmit={(fd) => commit({ ...db, matches: [...db.matches, { id: uid("mt"), championship_id: fd.championship_id || null, home_team_id: fd.home_team_id, away_team_id: fd.away_team_id }] })}>
          <Select name="championship_id" options={db.championships} labelKey="name" allowEmpty />
          <Select name="home_team_id" options={db.teams} labelKey="name" />
          <Select name="away_team_id" options={db.teams} labelKey="name" />
        </FormCard>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Jogadoras</h3>
        <table><thead><tr><th>Nome</th><th>Escalões</th></tr></thead>
        <tbody>{db.players.map((p) => <tr key={p.id}><td>{p.name}</td><td>{(p.age_groups || []).map((id: string) => db.age_groups.find((g) => g.id === id)?.code).filter(Boolean).join(" · ") || "—"}</td></tr>)}</tbody></table>
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
