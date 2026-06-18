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
  // grid template: time label + tag + one column per slot column
  const gridCols = `120px 110px repeat(${cols.length}, minmax(72px, 1fr))`;

  return (
    <section className="mb-10">
      <h2 className="text-lg font-extrabold text-pink-700 mb-3">{title}</h2>
      <div className="overflow-x-auto">
        <div className="min-w-max space-y-6">
          {blocks.map((block) => (
            <div key={block.block}>
              <h3 className="text-sm font-bold text-gray-700 mb-2">{block.block}</h3>
              <div className="space-y-1.5">
                {block.rows.map((row, i) => (
                  <div key={i} className="grid items-stretch gap-1.5" style={{ gridTemplateColumns: gridCols }}>
                    <div className="flex items-center text-xs font-semibold text-gray-700">{row.time}</div>
                    <div className="flex items-center text-xs italic text-gray-500">{row.tag ?? ""}</div>
                    {row.cells.map((cell, ci) =>
                      cell ? (
                        <SlotCell key={ci} slot={cell} myName={myName} onClaim={onClaim} onRelease={onRelease} />
                      ) : (
                        <div key={ci} className="h-14 w-full rounded-md bg-gray-100 border border-gray-200" />
                      ),
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
