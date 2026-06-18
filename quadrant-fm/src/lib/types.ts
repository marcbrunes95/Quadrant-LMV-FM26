export type SlotColor = "roig" | "vermell" | "verd" | "blanc";
export type TableName = "FM" | "FRIGO";

/** Static metadata seeded once. */
export interface SlotMeta {
  id: number;
  table: TableName;
  block: string;
  time: string;
  tag: "Muntatge" | "Desmuntatge" | null;
  color: SlotColor;
  col: string;
}

/** Dynamic state from the DB. */
export interface SlotState {
  id: number;
  taken_by: string | null;
}

/** Merged view used by the UI. */
export interface Slot extends SlotMeta {
  taken_by: string | null;
}

export interface GridRow {
  time: string;
  tag: "Muntatge" | "Desmuntatge" | null;
  cells: (Slot | null)[]; // aligned to the table's column order
}

export interface GridBlock {
  block: string;
  rows: GridRow[];
}

export interface BlockStat {
  block: string;
  free: number;
  total: number;
}

export interface Stats {
  free: number;
  total: number;
  byBlock: BlockStat[];
}
