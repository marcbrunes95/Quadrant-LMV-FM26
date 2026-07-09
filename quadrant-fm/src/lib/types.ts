export type SlotColor = "roig" | "vermell" | "verd" | "blanc";
export type TableName = "FM" | "FRIGO" | "GATZARA_BARRA" | "GATZARA_CUINA";
export type EventId = "fm" | "gatzara";

export interface MedalThresholds {
  bronze: number;
  plata: number;
  or: number;
}

/** Static metadata seeded once. */
export interface SlotMeta {
  id: number;
  table: TableName;
  block: string;
  time: string;
  /** Row label: Muntatge/Desmuntatge o rol de cuina (PATATERO, CUINA...). */
  tag: string | null;
  color: SlotColor;
  col: string;
  /** Esdeveniment; absent = "fm" (entrades FM originals, no es toquen). */
  event?: EventId;
  /** Número visible a la UI; absent = id (FM mostra id, Gatzara 1-51). */
  num?: number;
}

/** Dynamic state from the DB. */
export interface SlotState {
  id: number;
  taken_by: string | null;
  taken_at: string | null;
}

/** Merged view used by the UI. */
export interface Slot extends SlotMeta {
  taken_by: string | null;
  taken_at: string | null;
}

/** A logged claim/release action. */
export interface SlotEvent {
  id: number;
  slot_id: number;
  person: string;
  person_id: string | null;
  action: "claim" | "release";
  created_at: string;
}

export interface GridRow {
  time: string;
  tag: string | null;
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
