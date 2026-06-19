"use client";
import type { Slot } from "@/lib/types";
import { buildGrid } from "@/lib/grid";
import { SlotCell } from "./SlotCell";

interface Props {
  title: string;
  slots: Slot[];
  cols: string[];
  myName: string;
  onClaim: (id: number) => void;
  onRelease: (id: number) => void;
  onInfo?: (msg: string) => void;
}

export function ShiftGrid({ title, slots, cols, myName, onClaim, onRelease, onInfo }: Props) {
  const blocks = buildGrid(slots, cols);

  return (
    <section className="mb-8">
      {/* Nivell 1 — Activitat */}
      <h2 className="text-xl font-extrabold text-white bg-pink-600 rounded-lg px-3 py-2 mb-3 shadow-sm">
        {title}
      </h2>

      <div className="space-y-4">
        {blocks.map((block) => (
          /* Nivell 2 — Dia */
          <div key={block.block} className="rounded-lg border border-pink-100 overflow-hidden bg-white">
            <h3 className="text-sm font-bold text-pink-800 bg-pink-50 border-b border-pink-100 px-3 py-2">
              {block.block}
            </h3>

            <div className="p-2.5 space-y-3">
              {block.rows.map((row, i) => (
                /* Nivell 3 — Franja horària */
                <div key={i}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 bg-gray-100 rounded-full px-2 py-0.5">
                      <span aria-hidden>🕒</span>
                      {row.time}
                    </span>
                    {row.tag && (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-pink-500">
                        {row.tag}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {row.cells
                      .filter((c): c is Slot => c !== null)
                      .map((cell) => (
                        <SlotCell
                          key={cell.id}
                          slot={cell}
                          myName={myName}
                          onClaim={onClaim}
                          onRelease={onRelease}
                          onInfo={onInfo}
                        />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
