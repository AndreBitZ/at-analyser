import { describe, expect, it } from "vitest";
import { fiveMinuteBlockIndex, blockCode, derivedFilters } from "./time";
import { shotTotals, saveRate, dash } from "./formulas";
import { validateGoalZone } from "./zones";
import { sampleDataset, match } from "../data/sample";
import { teamBoxScore } from "./stats";

describe("blocos de 5 minutos", () => {
  it("usa floor(t/300)", () => {
    expect(fiveMinuteBlockIndex(0)).toBe(0);
    expect(fiveMinuteBlockIndex(299)).toBe(0);
    expect(fiveMinuteBlockIndex(300)).toBe(1);
    expect(blockCode(0)).toBe("P1_00_05");
    expect(blockCode(1800)).toBe("P2_30_35");
    expect(blockCode(3599)).toBe("P2_55_60");
  });
  it("marca crunchtime no fim com diferença <= 2", () => {
    expect(derivedFilters(3050, 1, match).CRUNCHTIME).toBe(true);
    expect(derivedFilters(3050, 5, match).CRUNCHTIME).toBe(false);
  });
});

describe("fórmulas de remate", () => {
  it("devolve — com denominador zero", () => {
    expect(dash(shotTotals([]).shot_efficiency)).toBe("—");
    expect(dash(saveRate(0, 0))).toBe("—");
  });
  it("exige zona de baliza em GOAL/SAVED", () => {
    expect(() => validateGoalZone("GOAL", null)).toThrow();
    expect(validateGoalZone("MISSED", "B1")).toBeNull();
  });
});

describe("amostra", () => {
  it("conta golos da casa a partir do evento SHOT único", () => {
    const box = teamBoxScore(sampleDataset.events, "home");
    expect(box.goals_scored).toBeGreaterThan(0);
    expect(box.shots).toBeGreaterThan(box.goals_scored);
  });
});
