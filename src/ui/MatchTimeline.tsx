import { formatClock } from "../domain/time";

const LABEL: Record<string, string> = {
  SHOT: "Remate",
  GOAL: "Golo",
  ASSIST: "Assistência",
  PRE_ASSIST: "Pré-assistência",
  TURNOVER: "Perda",
  STEAL: "Roubo",
  INTERCEPTION: "Interceção",
  RECOVERY: "Recuperação",
  DEFENSIVE_BLOCK: "Bloqueio",
  SEVEN_METER_WON: "7 metros ganho",
  TWO_MIN_RECEIVED: "2 minutos",
  TWO_MIN_DRAWN: "2 min causado",
  YELLOW_CARD: "Amarelo",
  RED_CARD: "Vermelho",
  BLUE_CARD: "Azul",
  GOALKEEPER_SAVE: "Defesa GR",
  PASSIVE_WARNING: "Aviso passivo",
  PASS: "Passe (passivo)",
  PASSIVE_TURNOVER: "Perda passivo",
  SUBSTITUTION_IN: "Entra",
  SUBSTITUTION_OUT: "Sai",
};

function shotOf(ev: any) {
  try { return ev.shot_json ? JSON.parse(ev.shot_json) : null; } catch { return null; }
}

function nameOf(players: any[], id: string) {
  return players.find((p) => p.id === id)?.name || "—";
}

export function buildTimeline(events: any[], stints: any[], players: any[]) {
  const items: { t: number; text: string; kind: string }[] = [];
  for (const ev of events) {
    const shot = shotOf(ev);
    const who = nameOf(players, ev.player_id);
    let extra = "";
    if (shot) extra = ` ${shot.field_shot_zone || ""}${shot.goal_target_zone ? "→" + shot.goal_target_zone : ""} ${shot.shot_result || ""}`;
    items.push({ t: Number(ev.timestamp_seconds || 0), kind: ev.type, text: `${LABEL[ev.type] || ev.type} · ${who}${extra}` });
  }
  for (const s of stints) {
    items.push({ t: Number(s.start_timestamp), kind: "IN", text: `Entra · ${s.player_name || nameOf(players, s.player_id)}` });
    if (s.end_timestamp < 99999) {
      items.push({ t: Number(s.end_timestamp), kind: "OUT", text: `Sai · ${s.player_name || nameOf(players, s.player_id)}` });
    }
  }
  return items.sort((a, b) => a.t - b.t);
}

export function calcStats(events: any[], teamId: string) {
  const ev = events.filter((e) => e.team_id === teamId);
  const shots = ev.filter((e) => e.type === "SHOT");
  let goals = 0, saved = 0, missed = 0;
  for (const s of shots) {
    const sh = shotOf(s);
    if (sh?.shot_result === "GOAL") goals += 1;
    else if (sh?.shot_result === "SAVED") saved += 1;
    else missed += 1;
  }
  const shotN = shots.length;
  return {
    shots: shotN,
    goals,
    saved,
    missed,
    pct: shotN ? Math.round((goals / shotN) * 100) : 0,
    assists: ev.filter((e) => e.type === "ASSIST").length,
    turnovers: ev.filter((e) => e.type === "TURNOVER" || e.type === "PASSIVE_TURNOVER").length,
    steals: ev.filter((e) => e.type === "STEAL" || e.type === "INTERCEPTION").length,
    blocks: ev.filter((e) => e.type === "DEFENSIVE_BLOCK").length,
    twoMin: ev.filter((e) => e.type === "TWO_MIN_RECEIVED").length,
    reds: ev.filter((e) => e.type === "RED_CARD" || e.type === "BLUE_CARD").length,
    saves: ev.filter((e) => e.type === "GOALKEEPER_SAVE").length,
    seven: ev.filter((e) => e.type === "SEVEN_METER_WON").length,
  };
}

export function TimelinePanel({ events, stints, players }: { events: any[]; stints: any[]; players: any[] }) {
  const items = buildTimeline(events, stints, players);
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <h3>Linha de tempo ({items.length})</h3>
      {!items.length && <p className="muted">Ainda não há ocorrências neste jogo.</p>}
      <ul className="timeline">
        {items.map((it, i) => (
          <li key={i}><strong>{formatClock(it.t)}</strong> {it.text}</li>
        ))}
      </ul>
    </div>
  );
}

export function StatsPanel({ events, homeId, awayId, homeName, awayName }: any) {
  const h = calcStats(events, homeId);
  const a = calcStats(events, awayId);
  const rows: [string, keyof typeof h][] = [
    ["Remates", "shots"], ["Golos", "goals"], ["Eficácia %", "pct"],
    ["Defesas GR", "saves"], ["Assistências", "assists"], ["Perdas", "turnovers"],
    ["Roubos/int.", "steals"], ["Bloqueios", "blocks"], ["2 min", "twoMin"],
    ["Vermelho/azul", "reds"], ["7 metros", "seven"],
  ];
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <h3>Estatísticas calculadas</h3>
      <table>
        <thead><tr><th></th><th>{homeName}</th><th>{awayName}</th></tr></thead>
        <tbody>
          {rows.map(([label, key]) => (
            <tr key={key}><td>{label}</td><td>{h[key]}</td><td>{a[key]}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
