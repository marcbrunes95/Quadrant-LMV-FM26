import { describe, it, expect } from "vitest";
import { SLOTS_META, slotsForEvent } from "../slots-data";

describe("slots-data (Gatzara)", () => {
  const g = slotsForEvent("gatzara");
  const byNum = new Map(g.map((s) => [s.num, s]));

  it("FM queda intacte: 149 entrades sense camp event", () => {
    const fm = slotsForEvent("fm");
    expect(fm).toHaveLength(149);
    expect(fm.every((s) => s.event === undefined)).toBe(true);
    expect(SLOTS_META).toHaveLength(252);
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

describe("slots-data (Tardeo)", () => {
  const t = slotsForEvent("tardeo");
  const byNum = new Map(t.map((s) => [s.num, s]));

  it("52 places, ids 301-352 = 300 + num", () => {
    expect(t).toHaveLength(52);
    expect(t.every((s) => s.id === 300 + (s.num ?? 0))).toBe(true);
    expect(new Set(t.map((s) => s.id)).size).toBe(52);
    expect(Math.min(...t.map((s) => s.id))).toBe(301);
    expect(Math.max(...t.map((s) => s.id))).toBe(352);
  });

  it("un sol bloc, una sola taula, tot color blanc", () => {
    expect(new Set(t.map((s) => s.block))).toEqual(new Set(["Dia 19/09"]));
    expect(t.every((s) => s.table === "TARDEO")).toBe(true);
    expect(t.every((s) => s.color === "blanc")).toBe(true);
  });

  it("només Muntatge i Desmuntatge porten tag; cap nom de rol", () => {
    expect(byNum.get(1)?.tag).toBe("Muntatge");
    expect(byNum.get(52)?.tag).toBe("Desmuntatge");
    expect(byNum.get(7)?.tag).toBeNull();
    expect(byNum.get(43)?.tag).toBeNull();
  });

  it("26 places bloquejades i 26 obertes, segons el full d'Excel", () => {
    const blocked = t.filter((s) => s.blocked).map((s) => s.num!).sort((a, b) => a - b);
    expect(blocked).toEqual([
      4, 5, 6, 8, 9, 10, 12, 14, 17, 20, 21, 22, 24, 26,
      29, 32, 33, 34, 38, 39, 41, 42, 45, 50, 51, 52,
    ]);
    expect(t.filter((s) => !s.blocked)).toHaveLength(26);
  });

  it("la 39 (cap de cuina, cel·la fusionada) té franja pròpia 18:00-22:00", () => {
    expect(byNum.get(39)).toMatchObject({ time: "18:00-22:00", blocked: true, col: "R" });
  });

  it("les places surten en ordre de número", () => {
    expect(t.map((s) => s.num)).toEqual([...Array(52)].map((_, i) => i + 1));
  });
});
