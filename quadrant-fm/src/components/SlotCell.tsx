"use client";
import type { Slot } from "@/lib/types";
import { COLOR_HEX, textOn } from "@/lib/colors";
import { formatWhen } from "@/lib/format";

interface Props {
  slot: Slot;
  /** Whether this slot belongs to the current user — resolved by ID (DNI), never by name. */
  mine: boolean;
  onClaim: (id: number) => void;
  onRelease: (id: number) => void;
  onInfo?: (msg: string) => void;
}

export function SlotCell({ slot, mine, onClaim, onRelease, onInfo }: Props) {
  const free = slot.taken_by === null;
  // Número visible (Gatzara mostra 1-51); l'id intern segueix manant.
  const num = slot.num ?? slot.id;

  // Places d'una altra colla: es veuen (amb el número i, si el sabem, el nom)
  // però no són nostres, així que no hi ha ni claim ni release possible.
  if (slot.blocked) {
    return (
      <button
        onClick={() => onInfo?.(`Plaça ${num} · la cobreix una altra colla`)}
        title={`Plaça ${num} · la cobreix una altra colla`}
        className="h-9 w-full rounded-md border border-black/10 px-1 leading-none overflow-hidden flex flex-col items-center justify-center text-white"
        style={{ backgroundColor: "#666666" }}
      >
        {slot.taken_by ? (
          <>
            <span className="text-[9px] opacity-70">#{num}</span>
            <span className="block w-full truncate text-[11px] font-semibold">{slot.taken_by}</span>
          </>
        ) : (
          <span className="text-sm font-bold opacity-80">{num}</span>
        )}
      </button>
    );
  }

  if (free) {
    return (
      <button
        onClick={() => onClaim(slot.id)}
        title={`Plaça ${num} lliure`}
        className="h-9 w-full rounded-md border border-black/10 text-sm font-bold transition active:scale-95 hover:shadow"
        style={{ background: COLOR_HEX[slot.color], color: textOn(slot.color) }}
      >
        {num}
      </button>
    );
  }

  const since = formatWhen(slot.taken_at);
  const sinceTxt = since ? ` · des de ${since}` : "";

  return (
    <button
      onClick={() =>
        mine
          ? onRelease(slot.id)
          : onInfo?.(`Plaça ${num} · ${slot.taken_by}${sinceTxt}`)
      }
      title={
        mine
          ? `Plaça ${num} · toca per alliberar${since ? ` (des de ${since})` : ""}`
          : `Plaça ${num} · ${slot.taken_by}${sinceTxt}`
      }
      className="h-9 w-full rounded-md border border-black/10 px-1 leading-none overflow-hidden flex flex-col items-center justify-center text-white"
      style={{
        backgroundColor: mine ? "#3d001c" : "#fa3c92",
        borderLeft: `6px solid ${COLOR_HEX[slot.color]}`,
      }}
    >
      <span className="text-[9px] opacity-70">
        #{num}
        {mine ? " ✕" : ""}
      </span>
      <span className="block w-full truncate text-[11px] font-semibold">{slot.taken_by}</span>
    </button>
  );
}
