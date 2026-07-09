import { describe, it, expect } from "vitest";
import { SLOTS_META, slotsForEvent } from "../slots-data";

describe("slots-data (Gatzara)", () => {
  const g = slotsForEvent("gatzara");
  const byNum = new Map(g.map((s) => [s.num, s]));

  it("FM queda intacte: 149 entrades sense camp event", () => {
    const fm = slotsForEvent("fm");
    expect(fm).toHaveLength(149);
    expect(fm.every((s) => s.event === undefined)).toBe(true);
    expect(SLOTS_META).toHaveLength(200);
  });

  it("Gatzara: 51 places, ids 201-251 = 200 + num", () => {
    expect(g).toHaveLength(51);
    expect(g.every((s) => s.id === 200 + (s.num ?? 0))).toBe(true);
    expect(new Set(g.map((s) => s.id)).size).toBe(51);
  });

  it("colors re-verificats: 18, 26 i 47 verds; 45 roig; 51 vermell", () => {
    expect(byNum.get(18)?.color).toBe("verd");
    expect(byNum.get(26)?.color).toBe("verd");
    expect(byNum.get(47)?.color).toBe("verd");
    expect(byNum.get(45)?.color).toBe("roig");
    expect(byNum.get(51)?.color).toBe("vermell");
  });

  it("fusions del full: 45 = 18:00-22:00, 51 = 18:00-0:00", () => {
    expect(byNum.get(45)).toMatchObject({ time: "18:00-22:00", tag: "CUINA", table: "GATZARA_CUINA" });
    expect(byNum.get(51)).toMatchObject({ time: "18:00-0:00", tag: "CAP DE PISTA" });
  });

  it("subtítols: Muntatge (1-12), BARRA (13-42), CUINA (43-50), CAP DE PISTA (51)", () => {
    const tagFor = (n: number) =>
      n <= 12 ? "Muntatge" : n <= 42 ? "BARRA" : n <= 50 ? "CUINA" : "CAP DE PISTA";
    expect(g.every((s) => s.tag === tagFor(s.num ?? 0))).toBe(true);
  });

  it("muntatges: dijous 19:00 (1-6) i divendres 11:00 (7-12), blancs", () => {
    expect(byNum.get(1)).toMatchObject({ block: "Gatzara dijous 16/07", time: "19:00", tag: "Muntatge", color: "blanc" });
    expect(byNum.get(7)).toMatchObject({ block: "Gatzara divendres 17/07", time: "11:00", tag: "Muntatge", color: "blanc" });
  });
});
