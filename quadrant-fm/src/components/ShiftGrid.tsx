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
}

export function ShiftGrid({ title, slots, cols, myName, onClaim, onRelease }: Props) {
  const blocks = buildGrid(slots, cols);

  return (
    <section className="mb-6">
      <h2 className="text-base font-extrabold text-pink-700 mb-2">{title}</h2>
      <div className="space-y-4">
        {blocks.map((block) => (
          <div key={block.block}>
            <h3 className="text-xs font-bold text-gray-700 mb-1.5">{block.block}</h3>
            <div className="space-y-1.5">
              {block.rows.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <div className="w-14 shrink-0 flex flex-col justify-center leading-tight">
                    <span className="text-[11px] font-semibold text-gray-700">{row.time}</span>
                    {row.tag && <span className="text-[9px] italic text-gray-500">{row.tag}</span>}
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
