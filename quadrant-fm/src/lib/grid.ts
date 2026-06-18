import type { Slot, GridBlock, GridRow, Stats, BlockStat } from "./types";

export const FM_COLS = ["C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];
export const FRIGO_COLS = ["C", "D", "E", "F"];

export function buildGrid(slots: Slot[], cols: string[]): GridBlock[] {
  const blocks: GridBlock[] = [];
  const blockIndex = new Map<string, GridBlock>();
  const rowIndex = new Map<string, GridRow>();

  for (const s of slots) {
    let block = blockIndex.get(s.block);
    if (!block) {
      block = { block: s.block, rows: [] };
      blockIndex.set(s.block, block);
      blocks.push(block);
    }
    const rowKey = `${s.block} ${s.time}`;
    let row = rowIndex.get(rowKey);
    if (!row) {
      row = { time: s.time, tag: s.tag, cells: cols.map(() => null) };
      rowIndex.set(rowKey, row);
      block.rows.push(row);
    }
    const ci = cols.indexOf(s.col);
    if (ci >= 0) row.cells[ci] = s;
  }
  return blocks;
}

export function computeStats(slots: Slot[]): Stats {
  let free = 0;
  const order: string[] = [];
  const map = new Map<string, BlockStat>();
  for (const s of slots) {
    if (s.taken_by === null) free++;
    let bs = map.get(s.block);
    if (!bs) {
      bs = { block: s.block, free: 0, total: 0 };
      map.set(s.block, bs);
      order.push(s.block);
    }
    bs.total++;
    if (s.taken_by === null) bs.free++;
  }
  return { free, total: slots.length, byBlock: order.map((b) => map.get(b)!) };
}
