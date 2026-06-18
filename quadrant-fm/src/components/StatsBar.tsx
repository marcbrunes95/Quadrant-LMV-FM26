import type { Stats } from "@/lib/types";

export function StatsBar({ stats }: { stats: Stats }) {
  const pct = stats.total ? Math.round(((stats.total - stats.free) / stats.total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-bold text-gray-800">
          {stats.free} / {stats.total} places lliures
        </span>
        <span className="text-xs text-gray-500">{pct}% cobert</span>
      </div>
      <div className="h-2 w-full rounded bg-gray-200 overflow-hidden">
        <div className="h-full bg-pink-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <details className="text-[11px] text-gray-600">
        <summary className="cursor-pointer text-gray-500 select-none">Detall per torns</summary>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
          {stats.byBlock.map((b) => (
            <span key={b.block}>
              {b.block}: <strong>{b.free}</strong>/{b.total}
            </span>
          ))}
        </div>
      </details>
    </div>
  );
}
