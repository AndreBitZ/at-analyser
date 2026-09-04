const ACT = [
  ["SHOT", "Remate"], ["ASSIST", "Assist"], ["TURNOVER", "Perda"],
  ["STEAL", "Roubo"], ["TWO_MIN_RECEIVED", "2 min"], ["GOALKEEPER_SAVE", "Defesa"],
  ["PASSIVE_WARNING", "Passivo"], ["SEVEN_METER_WON", "7 m"],
];

export default function TagBoard({
  squad, teamId, playerId, type, onTeam, onPlayer, onType, onSubmit,
}: {
  squad: any[]; teamId: string; playerId: string; type: string;
  onTeam: (id: string) => void; onPlayer: (id: string) => void;
  onType: (t: string) => void; onSubmit: () => void;
}) {
  const mine = squad.filter((s) => !teamId || s.team_id === teamId);
  return (
    <div className="card">
      <h3>Painel de tagging</h3>
      <div className="tag-grid">
        {mine.map((s) => (
          <button key={s.player_id} type="button" className={playerId === s.player_id ? "on" : ""} onClick={() => { onTeam(s.team_id); onPlayer(s.player_id); }}>
            {s.shirt_number || "·"} {s.player_name?.split(" ").slice(-1)[0]}
          </button>
        ))}
      </div>
      <div className="tag-grid" style={{ marginTop: 8 }}>
        {ACT.map(([k, lab]) => (
          <button key={k} type="button" className={type === k ? "on" : ""} onClick={() => onType(k)}>{lab}</button>
        ))}
      </div>
      <button type="button" style={{ marginTop: 8 }} onClick={onSubmit}>Registar agora</button>
    </div>
  );
}
