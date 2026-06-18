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
        title={`Plaça ${slot.id} lliure`}
        className="h-9 w-9 shrink-0 rounded-md border border-black/10 text-sm font-bold transition active:scale-95 hover:shadow"
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
      title={mine ? `Plaça ${slot.id} · toca per alliberar` : `Plaça ${slot.id} · ${slot.taken_by}`}
      className={`h-9 w-[4.25rem] shrink-0 rounded-md border px-1 leading-none overflow-hidden flex flex-col items-center justify-center ${
        mine
          ? "bg-pink-600 text-white border-pink-700"
          : "bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed"
      }`}
    >
      <span className="text-[9px] opacity-70">#{slot.id}{mine ? " ✕" : ""}</span>
      <span className="block w-full truncate text-[11px] font-semibold">{slot.taken_by}</span>
    </button>
  );
}
