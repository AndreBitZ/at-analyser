import { FormEvent, useEffect, useState } from "react";
import { get, post, patch } from "./adminApi";
import BackupPanel from "./BackupPanel";

type Fd = Record<string, string>;

export function Geral() {
  const [s, setS] = useState<any>(null);
  useEffect(() => { get("/stats").then(setS).catch(() => setS({})); }, []);
  if (!s) return <p className="muted">A carregar…</p>;
  const items = [
    ["Clubes", s.clubs], ["Escalões", s.age_groups], ["Épocas", s.seasons],
    ["Campeonatos", s.championships], ["Equipas", s.teams], ["Atletas", s.players],
    ["Jogos", s.matches], ["Transferências", s.transfers],
  ];
  return (
    <div>
      <h2>Geral</h2>
      <p className="muted">Totais na pasta de dados aberta.</p>
      <div className="grid">
        {items.map(([k, v]) => (
          <div className="card" key={String(k)}><h3>{k}</h3><div className="stat">{v ?? 0}</div></div>
        ))}
      </div>
      <div style={{ marginTop: 16 }}><BackupPanel /></div>
    </div>
  );
}

export function Epocas() {
  const [rows, setRows] = useState<any[]>([]);
  const [edit, setEdit] = useState<any>(null);
  const load = () => get("/seasons").then(setRows);
  useEffect(() => { load(); }, []);
  return (
    <div>
      <h2>Época</h2>
      <Form title={edit ? "Editar época" : "Nova época"} onSubmit={async (fd) => {
        if (edit) await patch(`/seasons/${edit.id}`, fd);
        else await post("/seasons", fd);
        setEdit(null); await load();
      }}>
        <input name="label" placeholder="2025/26" defaultValue={edit?.label || ""} required />
        <input name="start_date" type="date" defaultValue={edit?.start_date || ""} />
        <input name="end_date" type="date" defaultValue={edit?.end_date || ""} />
      </Form>
      <table><thead><tr><th>Label</th><th>Início</th><th>Fim</th><th></th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id}><td>{r.label}</td><td>{r.start_date || "—"}</td><td>{r.end_date || "—"}</td><td><button type="button" onClick={() => setEdit(r)}>Editar</button></td></tr>)}</tbody></table>
    </div>
  );
}

export function Campeonatos() {
  const [rows, setRows] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [edit, setEdit] = useState<any>(null);
  const load = async () => {
    setRows(await get("/championships"));
    setSeasons(await get("/seasons"));
    setTeams(await get("/teams"));
  };
  useEffect(() => { load(); }, []);
  return (
    <div>
      <h2>Campeonato</h2>
      <p className="muted">Cada campeonato pertence a uma época. Depois inscreves equipas.</p>
      <Form title={edit ? "Editar campeonato" : "Novo campeonato"} onSubmit={async (fd) => {
        if (edit) await patch(`/championships/${edit.id}`, fd);
        else await post("/championships", fd);
        setEdit(null); await load();
      }}>
        <Select name="season_id" options={seasons} labelKey="label" defaultValue={edit?.season_id} />
        <input name="name" placeholder="Nome" defaultValue={edit?.name || ""} required />
        <input name="organizer" placeholder="Organizador" defaultValue={edit?.organizer || ""} />
      </Form>
      <Form title="Inscrever equipa no campeonato" onSubmit={async (fd) => { await post("/championship-teams", fd); await load(); }}>
        <Select name="championship_id" options={rows} labelKey="name" />
        <Select name="team_id" options={teams} labelKey="name" />
      </Form>
      <table><thead><tr><th>Nome</th><th>Época</th><th></th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id}><td>{r.name}</td><td>{r.season_label}</td><td><button type="button" onClick={() => setEdit(r)}>Editar</button></td></tr>)}</tbody></table>
    </div>
  );
}

export function Clubes() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [edit, setEdit] = useState<any>(null);
  const load = async () => {
    setClubs(await get("/clubs"));
    setGroups(await get("/age-groups"));
    setTeams(await get("/teams"));
  };
  useEffect(() => { load(); }, []);
  return (
    <div>
      <h2>Clube</h2>
      <Form title={edit ? "Editar clube" : "Novo clube"} onSubmit={async (fd) => {
        if (edit) await patch(`/clubs/${edit.id}`, fd); else await post("/clubs", fd);
        setEdit(null); await load();
      }}>
        <input name="name" placeholder="Nome" defaultValue={edit?.name || ""} required />
        <input name="city" placeholder="Cidade" defaultValue={edit?.city || ""} />
      </Form>
      <Form title="Escalão" onSubmit={async (fd) => { await post("/age-groups", fd); await load(); }}>
        <Select name="club_id" options={clubs} labelKey="name" />
        <input name="code" placeholder="SUB14F" required />
        <input name="name" placeholder="Sub-14 feminino" required />
      </Form>
      <Form title="Equipa do clube" onSubmit={async (fd) => { await post("/teams", fd); await load(); }}>
        <Select name="club_id" options={clubs} labelKey="name" />
        <Select name="age_group_id" options={groups} labelKey="name" />
        <input name="name" placeholder="Nome da equipa" required />
      </Form>
      <table><thead><tr><th>Clube</th><th>Cidade</th><th></th></tr></thead>
        <tbody>{clubs.map((c) => <tr key={c.id}><td>{c.name}</td><td>{c.city || "—"}</td><td><button type="button" onClick={() => setEdit(c)}>Editar</button></td></tr>)}</tbody></table>
      <h3>Equipas</h3>
      <table><thead><tr><th>Equipa</th><th>Clube</th><th>Escalão</th></tr></thead>
        <tbody>{teams.map((t) => <tr key={t.id}><td>{t.name}</td><td>{t.club_name}</td><td>{t.age_group_code}</td></tr>)}</tbody></table>
    </div>
  );
}

export function Atletas() {
  const [players, setPlayers] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [rosters, setRosters] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [edit, setEdit] = useState<any>(null);
  const load = async () => {
    setPlayers(await get("/players"));
    setClubs(await get("/clubs"));
    setGroups(await get("/age-groups"));
    setTeams(await get("/teams"));
    setSeasons(await get("/seasons"));
    setRosters(await get("/rosters"));
    setTransfers(await get("/transfers"));
  };
  useEffect(() => { load(); }, []);
  return (
    <div>
      <h2>Atletas</h2>
      <p className="muted">O atleta mantém o mesmo registo. Transferir muda de equipa e guarda o histórico.</p>
      <Form title={edit ? "Editar atleta" : "Novo atleta"} onSubmit={async (fd) => {
        if (edit) await patch(`/players/${edit.id}`, fd);
        else await post("/players", { ...fd, age_group_ids: [fd.age_group_id, fd.age_group_id_2].filter(Boolean), is_goalkeeper: fd.primary_position === "GK" });
        setEdit(null); await load();
      }}>
        <Select name="club_id" options={clubs} labelKey="name" defaultValue={edit?.club_id} />
        <input name="name" placeholder="Nome" defaultValue={edit?.name || ""} required />
        <input name="shirt_number" type="number" placeholder="Nº" defaultValue={edit?.shirt_number || ""} />
        <select name="primary_position" defaultValue={edit?.primary_position || "CB"}>{["LW","LB","CB","RB","RW","PV","GK"].map((p) => <option key={p}>{p}</option>)}</select>
        <Select name="age_group_id" options={groups} labelKey="name" allowEmpty />
        <Select name="age_group_id_2" options={groups} labelKey="name" allowEmpty placeholder="2.º escalão" />
      </Form>
      <Form title="Associar a uma equipa (epoca)" onSubmit={async (fd) => { await post("/rosters", fd); await load(); }}>
        <Select name="player_id" options={players} labelKey="name" />
        <Select name="team_id" options={teams} labelKey="name" />
        <Select name="season_id" options={seasons} labelKey="label" />
      </Form>
      <Form title="Transferir (não apaga o atleta)" onSubmit={async (fd) => { await post("/transfers", fd); await load(); }}>
        <Select name="player_id" options={players} labelKey="name" />
        <Select name="from_team_id" options={teams} labelKey="name" allowEmpty placeholder="Equipa de origem" />
        <Select name="to_team_id" options={teams} labelKey="name" />
        <Select name="season_id" options={seasons} labelKey="label" />
      </Form>
      <table><thead><tr><th>Nome</th><th>Nº</th><th>Pos.</th><th>Escalões</th><th></th></tr></thead>
        <tbody>{players.map((p) => <tr key={p.id}><td>{p.name}</td><td>{p.shirt_number ?? "—"}</td><td>{p.primary_position}</td><td>{(p.age_groups || []).map((g: any) => g.code).join(" · ")}</td><td><button type="button" onClick={() => setEdit(p)}>Editar</button></td></tr>)}</tbody></table>
      <h3>Plantel</h3>
      <table><thead><tr><th>Atleta</th><th>Equipa</th><th>Época</th><th>Saiu</th></tr></thead>
        <tbody>{rosters.map((r, i) => <tr key={i}><td>{r.player_name}</td><td>{r.team_name}</td><td>{r.season_label}</td><td>{r.left_at || "activa"}</td></tr>)}</tbody></table>
      <h3>Transferências</h3>
      <table><thead><tr><th>Atleta</th><th>De</th><th>Para</th><th>Época</th></tr></thead>
        <tbody>{transfers.map((t) => <tr key={t.id}><td>{t.player_name}</td><td>{t.from_team_name || "—"}</td><td>{t.to_team_name}</td><td>{t.season_label}</td></tr>)}</tbody></table>
    </div>
  );
}

export function Jogos() {
  const [rows, setRows] = useState<any[]>([]);
  const [champs, setChamps] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [edit, setEdit] = useState<any>(null);
  const load = async () => {
    setRows(await get("/matches"));
    setChamps(await get("/championships"));
    setTeams(await get("/teams"));
    setSeasons(await get("/seasons"));
  };
  useEffect(() => { load(); }, []);
  return (
    <div>
      <h2>Jogos</h2>
      <Form title={edit ? "Editar jogo" : "Novo jogo"} onSubmit={async (fd) => {
        if (edit) await patch(`/matches/${edit.id}`, fd);
        else await post("/matches", fd);
        setEdit(null); await load();
      }}>
        <Select name="season_id" options={seasons} labelKey="label" allowEmpty />
        <Select name="championship_id" options={champs} labelKey="name" allowEmpty />
        <Select name="home_team_id" options={teams} labelKey="name" />
        <Select name="away_team_id" options={teams} labelKey="name" />
        <input name="kickoff_iso" type="datetime-local" defaultValue={edit?.kickoff_iso || ""} />
        <input name="venue" placeholder="Pavilhão" defaultValue={edit?.venue || ""} />
      </Form>
      <table><thead><tr><th>Casa</th><th>Fora</th><th>Campeonato</th><th>Época</th><th></th></tr></thead>
        <tbody>{rows.map((m) => <tr key={m.id}><td>{m.home_team_name}</td><td>{m.away_team_name}</td><td>{m.championship_name || "—"}</td><td>{m.season_label || "—"}</td><td><button type="button" onClick={() => setEdit(m)}>Editar</button></td></tr>)}</tbody></table>
    </div>
  );
}

function Select({ name, options, labelKey, allowEmpty, placeholder, defaultValue }: any) {
  return (
    <select name={name} required={!allowEmpty} defaultValue={defaultValue || ""}>
      <option value="">{placeholder || (allowEmpty ? "—" : "Selecionar")}</option>
      {options.map((o: any) => <option key={o.id} value={o.id}>{o[labelKey]}</option>)}
    </select>
  );
}
function Form({ title, children, onSubmit }: { title: string; children: React.ReactNode; onSubmit: (fd: Fd) => Promise<void> }) {
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const fd: Fd = {};
    form.forEach((v, k) => { fd[k] = String(v); });
    await onSubmit(fd);
    e.currentTarget.reset();
  }
  return <form className="card" onSubmit={submit} style={{ marginBottom: 16 }}><h3>{title}</h3><div className="stack">{children}</div><button type="submit" style={{ marginTop: 10 }}>Guardar</button></form>;
}
