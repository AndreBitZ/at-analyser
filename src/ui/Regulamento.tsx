import { IHF_RULE_CARDS } from "../domain/ihf";

export default function Regulamento() {
  return (
    <div>
      <h2>Regulamento IHF (análise)</h2>
      <p className="muted">
        Resumo operacional para marcar jogos. Não substitui o texto oficial da IHF.
        Estas regras estão ligadas à ficha: cronómetro, convocatória, 2 min, vermelho/azul, passivo e 7 em campo.
      </p>
      <div className="grid">
        {IHF_RULE_CARDS.map((r) => (
          <div className="card" key={r.id}>
            <h3>{r.title}</h3>
            <p>{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
