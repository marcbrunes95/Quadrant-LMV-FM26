import raw from "../../slots.json";
import type { EventId, SlotMeta } from "./types";

// slots.json carries an extra `oldNum` field (provenance) we drop here.
export const SLOTS_META: SlotMeta[] = (raw as Array<SlotMeta & { oldNum?: number }>).map(
  ({ oldNum: _oldNum, ...meta }) => meta,
);

/** Metadata d'un esdeveniment; les entrades sense `event` són FM. */
export function slotsForEvent(event: EventId): SlotMeta[] {
  return SLOTS_META.filter((m) => (m.event ?? "fm") === event);
}
