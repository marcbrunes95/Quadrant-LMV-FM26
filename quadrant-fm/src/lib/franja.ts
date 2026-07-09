import type { SlotMeta } from "./types";

/**
 * "19:00-20:30" → [inici, fi) en minuts des de la mitjanit del dia del bloc.
 * Les hores de matinada (< 6:00) es consideren l'endemà (+24 h), de manera que
 * "23:30-1:00" o "1:00-2:30" queden ben ordenades dins la mateixa nit.
 * Una hora sola sense fi (muntatge, "11:00") no té rang → null.
 */
export function timeRange(time: string): [number, number] | null {
  const m = /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m) return null;
  const norm = (h: number, min: number) => (h < 6 ? h + 24 : h) * 60 + min;
  const start = norm(+m[1], +m[2]);
  let end = norm(+m[3], +m[4]);
  if (end <= start) end += 24 * 60;
  return [start, end];
}

export function rangesOverlap(a: [number, number], b: [number, number]): boolean {
  return a[0] < b[1] && b[0] < a[1];
}

/**
 * Retorna la meva plaça (mateix bloc/dia) la franja de la qual coincideix en
 * hores amb la del target, o null si no n'hi ha cap.
 */
export function findOverlap(target: SlotMeta, mine: SlotMeta[]): SlotMeta | null {
  const tr = timeRange(target.time);
  if (!tr) return null;
  for (const s of mine) {
    if (s.block !== target.block || s.id === target.id) continue;
    const r = timeRange(s.time);
    if (r && rangesOverlap(tr, r)) return s;
  }
  return null;
}
