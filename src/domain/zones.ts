import type { FieldShotZone, GoalTargetZone } from "./types";

export const FIELD_ZONES: FieldShotZone[] = ["Z1", "Z2", "Z3", "Z4", "Z5", "Z6", "Z7", "Z8", "Z9"];
export const GOAL_ZONES: GoalTargetZone[] = ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9"];

export const FIELD_ZONE_LABELS: Record<FieldShotZone, string> = {
  Z1: "Ponta esquerda (6m)",
  Z2: "Intermédio esquerdo (6m)",
  Z3: "Central (6m)",
  Z4: "Intermédio direito (6m)",
  Z5: "Ponta direita (6m)",
  Z6: "Lateral esquerdo (9m+)",
  Z7: "Central exterior (9m+)",
  Z8: "Lateral direito (9m+)",
  Z9: "Transição / recuada",
};

export const GOAL_ZONE_LABELS: Record<GoalTargetZone, string> = {
  B1: "Superior esquerda",
  B2: "Superior centro",
  B3: "Superior direita",
  B4: "Média esquerda",
  B5: "Centro",
  B6: "Média direita",
  B7: "Inferior esquerda",
  B8: "Inferior centro",
  B9: "Inferior direita",
};

export const FIELD_GROUPS: Record<string, FieldShotZone[]> = {
  ZONAS_6M: ["Z1", "Z2", "Z3", "Z4", "Z5"],
  ZONAS_9M: ["Z6", "Z7", "Z8"],
  ZONA_TRANSICAO: ["Z9"],
  LADO_ESQUERDO: ["Z1", "Z2", "Z6"],
  CENTRO: ["Z3", "Z7", "Z9"],
  LADO_DIREITO: ["Z4", "Z5", "Z8"],
  PONTA: ["Z1", "Z5"],
  PROXIMIDADE_CENTRAL: ["Z2", "Z3", "Z4"],
  EXTERIOR: ["Z6", "Z7", "Z8"],
};

export const GOAL_GROUPS: Record<string, GoalTargetZone[]> = {
  BALIZA_SUPERIOR: ["B1", "B2", "B3"],
  BALIZA_MEDIA: ["B4", "B5", "B6"],
  BALIZA_INFERIOR: ["B7", "B8", "B9"],
  BALIZA_ESQUERDA: ["B1", "B4", "B7"],
  BALIZA_CENTRO: ["B2", "B5", "B8"],
  BALIZA_DIREITA: ["B3", "B6", "B9"],
  CANTOS: ["B1", "B3", "B7", "B9"],
  ZONAS_CENTRAIS: ["B2", "B4", "B5", "B6", "B8"],
};

export function validateGoalZone(
  result: string,
  zone: GoalTargetZone | null
): GoalTargetZone | null {
  if (result === "GOAL" || result === "SAVED") {
    if (!zone) throw new Error("goal_target_zone é obrigatória em GOAL e SAVED");
    return zone;
  }
  if (result === "MISSED" || result === "BLOCKED") return null;
  return zone;
}
