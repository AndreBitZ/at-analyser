/** Regras IHF usadas na análise (resumo operacional, não é o texto oficial). */

export const IHF = {
  halfSeconds: 1800,
  matchSeconds: 3600,
  extraHalfSeconds: 300,
  halfTimeSeconds: 600,
  suspensionSeconds: 120,
  maxCourtPlayers: 7,
  maxFieldWithGk: 6,
  maxSquad: 16,
  maxTwoMinBeforeDQ: 3,
  maxPassesAfterPassive: 6,
  sevenMeters: true,
};

export type IhfNumerical =
  | "6v6"
  | "6v5"
  | "5v6"
  | "5v5"
  | "7v6"
  | "6v7"
  | "7v5"
  | "5v7"
  | "4v6"
  | "6v4"
  | "OTHER";

export function numericalLabel(onFor: number, onAgainst: number): IhfNumerical {
  const a = Math.min(7, onFor);
  const b = Math.min(7, onAgainst);
  const key = `${a}v${b}` as IhfNumerical;
  const ok: IhfNumerical[] = ["6v6", "6v5", "5v6", "5v5", "7v6", "6v7", "7v5", "5v7", "4v6", "6v4"];
  return ok.includes(key) ? key : "OTHER";
}

export const IHF_RULE_CARDS = [
  {
    id: "tempo",
    title: "Tempo de jogo",
    text: "2 × 30 min. Intervalo 10 min. Prolongamento 2 × 5 min. O cronómetro da ficha é o relógio oficial da análise.",
  },
  {
    id: "efectivo",
    title: "Jogadoras em campo",
    text: "Máximo 7 (6 de campo + GR). Com GR-jogadora são 7 de campo (7×6). Mais de 7 em campo é ilegal.",
  },
  {
    id: "convocatoria",
    title: "Convocatória",
    text: "Até 16 atletas. Só convocadas entram na ficha, no tempo e nas acções.",
  },
  {
    id: "amarelo",
    title: "Cartão amarelo",
    text: "Advertência. Não tira do campo. Acumula para punição progressiva.",
  },
  {
    id: "doismin",
    title: "Exclusão 2 minutos",
    text: "Sai de imediato. Equipa em inferioridade 2:00. A própria não entra antes do fim. 3.ª exclusão da mesma atleta = desqualificação.",
  },
  {
    id: "vermelho",
    title: "Desqualificação (vermelho)",
    text: "Sai de vez. Equipa em inferioridade 2:00. Só depois entra outra no lugar. A desqualificada não volta.",
  },
  {
    id: "azul",
    title: "Cartão azul",
    text: "Desqualificação com relatório escrito. Mesmo efeito em campo que o vermelho + 2 min de inferioridade.",
  },
  {
    id: "passivo",
    title: "Jogo passivo",
    text: "Aviso do árbitro. Depois no máximo 6 passes. No 6.º sem remate = perda. Na ficha: PASSIVE_WARNING e depois PASS.",
  },
  {
    id: "sete",
    title: "Lançamento de 7 metros",
    text: "SEVEN_METER_WON / remate Z7m → B1–B9. GR na linha de golo. Sem falta do lançador.",
  },
  {
    id: "vazio",
    title: "Baliza vazia / 7×6",
    text: "GR sai, entra uma de campo. 7 contra 6. Se sofrer golo com GR fora, conta como golo em baliza vazia.",
  },
  {
    id: "subs",
    title: "Substituições",
    text: "Livres, pela zona de substituição. Quem entra só depois de a outra ter saído. Entrar à mais = exclusão à que entra.",
  },
];
