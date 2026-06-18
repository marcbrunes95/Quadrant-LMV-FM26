import raw from "../../slots.json";
import type { SlotMeta } from "./types";

// slots.json carries an extra `oldNum` field (provenance) we drop here.
export const SLOTS_META: SlotMeta[] = (raw as Array<SlotMeta & { oldNum: number }>).map(
  ({ oldNum: _oldNum, ...meta }) => meta,
);
