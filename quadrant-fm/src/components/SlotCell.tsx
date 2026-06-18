"use client";
import type { Slot } from "@/lib/types";
import { COLOR_HEX, textOn } from "@/lib/colors";

interface Props {
  slot: Slot;
  myName: string;
  onClaim: (id: number) => void;
  onRelease: (id: number) => void;
}

export function SlotCell({ slot, myName, onClaim, onRelease }: Props) {
  const free = slot.taken_by === null;
  const mine = slot.taken_by === myName;

  if (free) {
    return (
      <button
        onClick={() => onClaim(slot.id)}
        title={`Plaça lliure (${slot.color})`}
        className="h-14 w-full rounded-md border border-black/10 text-sm font-bold transition hover:scale-[1.04] hover:shadow"
        style={{ background: COLOR_HEX[slot.color], color: textOn(slot.color) }}
      >
        {slot.id}
      </button>
    );
  }

  return (
    <button
      onClick={() => mine && onRelease(slot.id)}
      disabled={!mine}
      title={mine ? "Toca per alliberar la teva plaça" : `Ocupada per ${slot.taken_by}`}
      className={`h-14 w-full rounded-md border text-xs font-semibold leading-tight px-1 overflow-hidden ${
        mine
          ? "bg-pink-600 text-white border-pink-700 cursor-pointer"
          : "bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed"
      }`}
    >
      <span className="block truncate">{slot.taken_by}</span>
      <span className="block text-[10px] opacity-70">#{slot.id}{mine ? " · treure" : ""}</span>
    </button>
  );
}
