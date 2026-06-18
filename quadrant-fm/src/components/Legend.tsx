import { COLOR_HEX, COLOR_SHORT, COLOR_LABEL, LEGEND_ORDER } from "@/lib/colors";

export function Legend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-600">
      {LEGEND_ORDER.map((c) => (
        <span key={c} className="flex items-center gap-1" title={COLOR_LABEL[c]}>
          <span
            className="inline-block h-3 w-3 rounded-sm border border-black/20"
            style={{ background: COLOR_HEX[c] }}
          />
          {COLOR_SHORT[c]}
        </span>
      ))}
    </div>
  );
}
