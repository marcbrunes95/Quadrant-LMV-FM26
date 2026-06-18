import type { Stats } from "@/lib/types";

export function StatsBar({ stats }: { stats: Stats }) {
  const pct = stats.total ? Math.round(((stats.total - stats.free) / stats.total) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="font-bold text-gray-800">
          {stats.free} / {stats.total} places lliures
        </span>
        <span className="text-xs text-gray-500">{pct}% cobert</span>
      </div>
      <div className="h-2 w-full rounded bg-gray-200 overflow-hidden">
        <div className="h-full bg-pink-600" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
        {stats.byBlock.map((b) => (
          <span key={b.block}>
            {b.block}: <strong>{b.free}</strong>/{b.total}
          </span>
        ))}
      </div>
    </div>
  );
}
