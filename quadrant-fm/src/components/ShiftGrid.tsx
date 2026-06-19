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
    <section className="mb-8 rounded-2xl border-2 border-pink-400 bg-white p-3 sm:p-4 shadow-sm">
      {/* Nivell 1 — Activitat (super-card) */}
      <h2 className="text-2xl font-extrabold uppercase tracking-wide text-pink-600 mb-4">
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
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-gray-800 bg-gray-100 rounded-full px-2.5 py-1">
                      <span aria-hidden>🕒</span>
                      {row.time}
                    </span>
                    {row.tag && (
                      <span className="text-xs font-bold uppercase tracking-wide text-pink-600">
                        {row.tag}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1">
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
