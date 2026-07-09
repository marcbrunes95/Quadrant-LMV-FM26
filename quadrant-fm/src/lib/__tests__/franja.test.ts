import { describe, it, expect } from "vitest";
import { timeRange, rangesOverlap, findOverlap } from "../franja";
import type { SlotMeta } from "../types";

function meta(p: Partial<SlotMeta>): SlotMeta {
  return { id: 1, table: "GATZARA_BARRA", block: "Gatzara divendres 17/07",
    time: "19:00-20:30", tag: null, color: "verd", col: "N", ...p };
}

describe("timeRange", () => {
  it("franja normal", () => expect(timeRange("19:00-20:30")).toEqual([1140, 1230]));
  it("acaba a mitjanit", () => expect(timeRange("18:00-0:00")).toEqual([1080, 1440]));
  it("creua mitjanit", () => expect(timeRange("23:30-1:00")).toEqual([1410, 1500]));
  it("matinada sencera", () => expect(timeRange("1:00-2:30")).toEqual([1500, 1590]));
  it("hora sola (muntatge) no té rang", () => expect(timeRange("11:00")).toBeNull());
});

describe("rangesOverlap", () => {
  it("cap de pista 18:00-0:00 coincideix amb barra 19:00-20:30", () => {
    expect(rangesOverlap(timeRange("18:00-0:00")!, timeRange("19:00-20:30")!)).toBe(true);
  });
  it("18:00-0:00 coincideix amb 23:30-1:00 però no amb 1:00-2:30", () => {
    expect(rangesOverlap(timeRange("18:00-0:00")!, timeRange("23:30-1:00")!)).toBe(true);
    expect(rangesOverlap(timeRange("18:00-0:00")!, timeRange("1:00-2:30")!)).toBe(false);
  });
  it("franges consecutives no se solapen", () => {
    expect(rangesOverlap(timeRange("19:00-20:30")!, timeRange("20:30-22:00")!)).toBe(false);
  });
});

describe("findOverlap", () => {
  const capPista = meta({ id: 251, num: 51, time: "18:00-0:00" });
  it("troba el conflicte dins del mateix bloc", () => {
    const target = meta({ id: 213, num: 13, time: "19:00-20:30" });
    expect(findOverlap(target, [capPista])?.id).toBe(251);
  });
  it("cap conflicte si és un altre dia (bloc)", () => {
    const target = meta({ id: 213, time: "19:00-20:30", block: "Gatzara dijous 16/07" });
    expect(findOverlap(target, [capPista])).toBeNull();
  });
  it("el muntatge (hora sola) no bloqueja per solapament", () => {
    const target = meta({ id: 207, time: "11:00" });
    expect(findOverlap(target, [capPista])).toBeNull();
  });
});
