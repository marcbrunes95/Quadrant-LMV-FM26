import { describe, it, expect } from "vitest";
import { buildGrid, computeStats, FM_COLS, FRIGO_COLS, GATZARA_COLS } from "../grid";
import type { Slot } from "../types";

function slot(p: Partial<Slot>): Slot {
  return {
    id: 1, table: "FM", block: "B1", time: "t1", tag: null,
    color: "verd", col: "C", taken_by: null, taken_at: null, ...p,
  };
}

describe("buildGrid", () => {
  it("groups slots by block then by time row, aligned to column order", () => {
    const slots: Slot[] = [
      slot({ id: 1, block: "B1", time: "t1", col: "C" }),
      slot({ id: 2, block: "B1", time: "t1", col: "E" }),
      slot({ id: 3, block: "B1", time: "t2", col: "C" }),
    ];
    const grid = buildGrid(slots, FM_COLS);
    expect(grid).toHaveLength(1);
    expect(grid[0].block).toBe("B1");
    expect(grid[0].rows).toHaveLength(2);
    const row1 = grid[0].rows[0];
    expect(row1.cells[0]?.id).toBe(1); // col C
    expect(row1.cells[1]).toBeNull();  // col D empty
    expect(row1.cells[2]?.id).toBe(2); // col E
  });

  it("preserves the order blocks/rows first appear in the input", () => {
    const slots: Slot[] = [
      slot({ id: 1, block: "Z", time: "t1", col: "C" }),
      slot({ id: 2, block: "A", time: "t1", col: "C" }),
    ];
    const grid = buildGrid(slots, FM_COLS);
    expect(grid.map((g) => g.block)).toEqual(["Z", "A"]);
  });

  it("carries the row tag", () => {
    const slots = [slot({ id: 1, block: "B1", time: "t1", col: "C", tag: "Muntatge" })];
    const grid = buildGrid(slots, FM_COLS);
    expect(grid[0].rows[0].tag).toBe("Muntatge");
  });

  it("separa files amb la mateixa hora però tag (rol) diferent", () => {
    const slots: Slot[] = [
      slot({ id: 243, block: "G", time: "20:00-22:00", tag: "PATATERO", col: "N" }),
      slot({ id: 244, block: "G", time: "20:00-22:00", tag: "CUINA", col: "O" }),
      slot({ id: 248, block: "G", time: "20:00-22:00", tag: "MUNTAR/SERVIR", col: "Q" }),
      slot({ id: 249, block: "G", time: "20:00-22:00", tag: "MUNTAR/SERVIR", col: "R" }),
    ];
    const grid = buildGrid(slots, GATZARA_COLS);
    expect(grid[0].rows).toHaveLength(3);
    expect(grid[0].rows.map((r) => r.tag)).toEqual(["PATATERO", "CUINA", "MUNTAR/SERVIR"]);
    expect(grid[0].rows[2].cells.filter(Boolean).map((c) => c!.id)).toEqual([248, 249]);
  });
});

describe("computeStats", () => {
  it("counts free vs total globally and per block", () => {
    const slots: Slot[] = [
      slot({ id: 1, block: "B1", taken_by: null }),
      slot({ id: 2, block: "B1", taken_by: "Marc" }),
      slot({ id: 3, block: "B2", taken_by: null }),
    ];
    const stats = computeStats(slots);
    expect(stats.total).toBe(3);
    expect(stats.free).toBe(2);
    expect(stats.byBlock).toEqual([
      { block: "B1", free: 1, total: 2 },
      { block: "B2", free: 1, total: 1 },
    ]);
  });
});

describe("column constants", () => {
  it("FM has 11 columns, FRIGO has 4", () => {
    expect(FM_COLS).toHaveLength(11);
    expect(FRIGO_COLS).toHaveLength(4);
  });
});
