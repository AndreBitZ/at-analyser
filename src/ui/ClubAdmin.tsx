import { FormEvent, useState } from "react";
import { load, save, uid, type Store } from "../data/localStore";

export default function ClubAdmin() {
  const [db, setDb] = useState<Store>(() => load());
  function commit(next: Store) {
    save(next);
    setDb(next);
  }
  return (
    <div>
      <p className="muted">
        Os dados ficam neste browser (grátis). No mesmo computador e no mesmo Chrome/Safari continuam gravados.
      </p>
      <div className="grid">
        <FormCard title="Clube" onSubmit={(fd) => commit({ ...db, clubs: [...db.clubs, { id: uid("club"), name: fd.name, city: fd.city }] })}>
          <input name="name" placeholder="Nome do clube" required />
          <input name="city" placeholder="Cidade" />
        </FormCard>
        <FormCard title="Escalão" onSubmit={(fd) => commit({ ...db, age_groups: [...db.age_groups, { id: uid("ag"), club_id: fd.club_id, code: fd.code, name: fd.name, gender: fd.gender }] })}>
          <Select name="club_id" options={db.clubs} labelKey="name" />
          <input name="code" placeholder="SUB14F" required />
          <input name="name" placeholder="Sub-14 feminino" required />
          <select name="gender" defaultValue="F"><option value="F">Feminino</option><option value="M">Masculino</option></select>
        </FormCard>
        <FormCard title="Época" onSubmit={(fd) => commit({ ...db, seasons: [...db.seasons, { id: uid("szn"), label: fd.label, start_date: fd.start_date, end_date: fd.end_date }] })}>
          <input name="label" placeholder="2025/26" required />
          <input name="start_date" type="date" /><input name="end_date" type="date" />
        </FormCard>
        <FormCard title="Campeonato" onSubmit={(fd) => commit({ ...db, championships: [...db.championships, { id: uid("cmp"), season_id: fd.season_id, age_group_id: fd.age_group_id || null, name: fd.name }] })}>
          <Select name="season_id" options={db.seasons} labelKey="label" />
          <Select name="age_group_id" options={db.age_groups} labelKey="name" allowEmpty />
          <input name="name" placeholder="Nome do campeonato" required />
        </FormCard>
        <FormCard title="Equipa" onSubmit={(fd) => commit({ ...db, teams: [...db.teams, { id: uid("tm"), club_id: fd.club_id, age_group_id: fd.age_group_id, name: fd.name, short_name: fd.short_name }] })}>
          <Select name="club_id" options={db.clubs} labelKey="name" />
          <Select name="age_group_id" options={db.age_groups} labelKey="name" />
          <input name="name" placeholder="Nome da equipa" required />
          <input name="short_name" placeholder="Sigla" />
        </FormCard>
        <FormCard title="Inscrever equipa no campeonato" onSubmit={(fd) => commit({ ...db, championship_teams: [...db.championship_teams, { championship_id: fd.championship_id, team_id: fd.team_id }] })}>
          <Select name="championship_id" options={db.championships} labelKey="name" />
          <Select name="team_id" options={db.teams} labelKey="name" />
        </FormCard>
        <FormCard title="Jogadora (até 2 escalões)" onSubmit={(fd) => commit({ ...db, players: [...db.players, { id: uid("pl"), club_id: fd.club_id, name: fd.name, shirt_number: fd.shirt_number || null, primary_position: fd.primary_position, age_groups: [fd.age_group_id, fd.age_group_id_2].filter(Boolean) }] })}>
          <Select name="club_id" options={db.clubs} labelKey="name" />
          <input name="name" placeholder="Nome" required />
          <input name="shirt_number" type="number" placeholder="Nº" />
          <select name="primary_position" defaultValue="CB">{["LW","LB","CB","RB","RW","PV","GK"].map((p) => <option key={p}>{p}</option>)}</select>
          <Select name="age_group_id" options={db.age_groups} labelKey="name" />
          <Select name="age_group_id_2" options={db.age_groups} labelKey="name" allowEmpty placeholder="2.º escalão" />
        </FormCard>
        <FormCard title="Jogo" onSubmit={(fd) => commit({ ...db, matches: [...db.matches, { id: uid("mt"), season_id: fd.season_id || null, championship_id: fd.championship_id || null, home_team_id: fd.home_team_id, away_team_id: fd.away_team_id, kickoff_iso: fd.kickoff_iso || null, venue: fd.venue }] })}>
          <Select name="season_id" options={db.seasons} labelKey="label" allowEmpty />
          <Select name="championship_id" options={db.championships} labelKey="name" allowEmpty />
          <Select name="home_team_id" options={db.teams} labelKey="name" />
          <Select name="away_team_id" options={db.teams} labelKey="name" />
          <input name="kickoff_iso" type="datetime-local" />
          <input name="venue" placeholder="Pavilhão" />
        </FormCard>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Jogadoras</h3>
        <table><thead><tr><th>Nome</th><th>Nº</th><th>Pos.</th><th>Escalões</th></tr></thead>
        <tbody>{db.players.map((p) => <tr key={p.id}><td>{p.name}</td><td>{p.shirt_number ?? "—"}</td><td>{p.primary_position}</td><td>{(p.age_groups || []).map((id: string) => db.age_groups.find((g) => g.id === id)?.code).filter(Boolean).join(" · ") || "—"}</td></tr>)}</tbody></table>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <h3>Jogos</h3>
        <table><thead><tr><th>Época</th><th>Campeonato</th><th>Casa</th><th>Fora</th></tr></thead>
        <tbody>{db.matches.map((m) => <tr key={m.id}><td>{db.seasons.find((s) => s.id === m.season_id)?.label ?? "—"}</td><td>{db.championships.find((c) => c.id === m.championship_id)?.name ?? "—"}</td><td>{db.teams.find((t) => t.id === m.home_team_id)?.name}</td><td>{db.teams.find((t) => t.id === m.away_team_id)?.name}</td></tr>)}</tbody></table>
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

function FormCard({ title, children, onSubmit }: { title: string; children: React.ReactNode; onSubmit: (fd: Record<string, string>) => void }) {
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const fd: Record<string, string> = {};
    form.forEach((v, k) => { fd[k] = String(v); });
    onSubmit(fd);
    e.currentTarget.reset();
  }
  return (
    <form className="card" onSubmit={submit}>
      <h3>{title}</h3>
      <div className="stack">{children}</div>
      <button type="submit" style={{ marginTop: 10 }}>Guardar</button>
    </form>
  );
}
