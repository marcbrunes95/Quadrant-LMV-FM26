import { COLOR_HEX, COLOR_LABEL, LEGEND_ORDER } from "@/lib/colors";

export function Legend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {LEGEND_ORDER.map((c) => (
        <span key={c} className="flex items-center gap-1.5">
          <span
            className="inline-block h-4 w-4 rounded border border-black/20"
            style={{ background: COLOR_HEX[c] }}
          />
          {COLOR_LABEL[c]}
        </span>
      ))}
    </div>
  );
}
