import { FormEvent, useState } from "react";
import { load, save, uid, type Store } from "../data/localStore";
import { clientId, connectDrive, isDriveConnected, pullFromDrive, pushToDrive } from "../data/driveSync";

export default function ClubAdmin() {
  const [db, setDb] = useState<Store>(() => load());
  const [drive, setDrive] = useState(isDriveConnected());
  const [msg, setMsg] = useState("");

  async function commit(next: Store) {
    save(next);
    setDb(next);
    if (isDriveConnected()) {
      try {
        await pushToDrive(next);
        setMsg("Guardado no Drive");
      } catch (e: any) {
        setMsg(e.message);
      }
    }
  }

  async function ligar() {
    try {
      setMsg("A pedir autorização Google…");
      await connectDrive();
      setDrive(true);
      const remote = await pullFromDrive();
      if (remote && (remote.clubs?.length || remote.players?.length)) {
        save(remote as Store);
        setDb({ ...load(), ...remote });
        setMsg("Drive ligado. Dados remotos carregados.");
      } else {
        await pushToDrive(load());
        setMsg("Drive ligado. Cópia enviada.");
      }
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  function exportJson() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(db, null, 2)], { type: "application/json" }));
    a.download = "at-analyser-db.json";
    a.click();
  }

  return (
    <div>
      <p className="muted">
        Cada Guardar grava neste browser. Com o Drive ligado, grava também na cloud.
      </p>
      <div className="row">
        <button type="button" onClick={ligar} disabled={!clientId() && false}>
          {drive ? "Drive ligado" : "Ligar Google Drive"}
        </button>
        <button type="button" onClick={exportJson}>Exportar JSON</button>
      </div>
      {!clientId() && (
        <p className="note">
          Falta o Client ID. Segue o guia docs/DRIVE.md (console.cloud.google.com) e põe VITE_GOOGLE_CLIENT_ID no .env.
        </p>
      )}
      {msg && <p className="muted">{msg}</p>}
      <div className="grid">
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
