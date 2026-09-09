import { describe, it, expect } from "vitest";
import { timeRange, rangesOverlap, findOverlap } from "../franja";
import type { SlotMeta } from "../types";
import { slotsForEvent } from "../slots-data";

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

describe("solapaments reals del Tardeo (Dia 19/09)", () => {
  const tardeo = slotsForEvent("tardeo");
  const p = (num: number) => tardeo.find((s) => s.num === num)!;

  it("cuina 18:00-20:00 xoca amb barra 19:00-21:00", () => {
    expect(findOverlap(p(40), [p(7)])?.num).toBe(7);
  });

  it("cuina 20:00-22:00 xoca amb barra 20:50-22:30", () => {
    expect(findOverlap(p(43), [p(16)])?.num).toBe(16);
  });

  it("l'últim torn de barra xoca amb el desmuntatge", () => {
    expect(findOverlap(p(35), [p(47)])?.num).toBe(47);
  });

  it("el cap de cuina 18:00-22:00 xoca amb les dues franges de cuina", () => {
    expect(findOverlap(p(39), [p(40)])?.num).toBe(40);
    expect(findOverlap(p(39), [p(44)])?.num).toBe(44);
  });

  it("22:20-00:00 i 23:50-1:15 se solapen tot i creuar la mitjanit", () => {
    expect(findOverlap(p(23), [p(27)])?.num).toBe(27);
  });

  it("el muntatge de les 10:30 no té rang i no bloqueja res", () => {
    expect(findOverlap(p(1), [p(7), p(47)])).toBeNull();
  });

  it("dues franges consecutives que només es toquen no xoquen", () => {
    // 18:00-20:00 acaba just quan comença 20:00-22:00.
    expect(findOverlap(p(40), [p(43)])).toBeNull();
  });
});
