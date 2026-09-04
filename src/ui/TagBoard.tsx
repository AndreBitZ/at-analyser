const ACT = [
  ["SHOT", "Remate"], ["ASSIST", "Assist"], ["TURNOVER", "Perda"],
  ["STEAL", "Roubo"], ["TWO_MIN_RECEIVED", "2 min"], ["GOALKEEPER_SAVE", "Defesa"],
  ["PASSIVE_WARNING", "Passivo"], ["SEVEN_METER_WON", "7 m"],
  ["POSSESSION_START", "Início posse"], ["POSSESSION_END", "Fim posse"],
];
const ATT = [["COUNTER", "Contra"], ["FAST", "2.ª vaga"], ["POSITIONAL", "Posicional"], ["SEVEN_M", "7 m"]];
const DEF = [["6-0", "6-0"], ["5-1", "5-1"], ["3-2-1", "3-2-1"]];

export default function TagBoard({
  squad, teamId, playerId, type, attackType, defenseSystem,
  onTeam, onPlayer, onType, onAttack, onDefense, onSubmit,
}: {
  squad: any[]; teamId: string; playerId: string; type: string;
  attackType: string; defenseSystem: string;
  onTeam: (id: string) => void; onPlayer: (id: string) => void;
  onType: (t: string) => void; onAttack: (t: string) => void;
  onDefense: (t: string) => void; onSubmit: () => void;
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
      <p className="muted">Ataque</p>
      <div className="tag-grid">
        {ATT.map(([k, lab]) => <button key={k} type="button" className={attackType === k ? "on" : ""} onClick={() => onAttack(k)}>{lab}</button>)}
      </div>
      <p className="muted">Defesa adversária</p>
      <div className="tag-grid">
        {DEF.map(([k, lab]) => <button key={k} type="button" className={defenseSystem === k ? "on" : ""} onClick={() => onDefense(k)}>{lab}</button>)}
      </div>
      <p className="muted">Acção</p>
      <div className="tag-grid">
        {ACT.map(([k, lab]) => <button key={k} type="button" className={type === k ? "on" : ""} onClick={() => onType(k)}>{lab}</button>)}
      </div>
      <button type="button" style={{ marginTop: 8 }} onClick={onSubmit}>Registar agora</button>
    </div>
  );
}
