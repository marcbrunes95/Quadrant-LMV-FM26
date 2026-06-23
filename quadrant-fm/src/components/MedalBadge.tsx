interface Tier {
  emoji: string;
  label: string;
  bg: string;
  fg: string;
}

const BRONZE: Tier = { emoji: "🥉", label: "Bronze", bg: "#f6e3d0", fg: "#a05a2c" };
const SILVER: Tier = { emoji: "🥈", label: "Plata", bg: "#e9ecef", fg: "#6b7280" };
const GOLD: Tier = { emoji: "🥇", label: "Or", bg: "#fdf3c4", fg: "#a37e00" };

export function tierFor(count: number): Tier | null {
  if (count >= 5) return GOLD;
  if (count >= 3) return SILVER;
  if (count >= 1) return BRONZE;
  return null;
}

export function MedalBadge({ count, celebrating }: { count: number; celebrating: boolean }) {
  const tier = tierFor(count);
  if (!tier) return null;
  return (
    <span
      title={`Portes ${count} ${count === 1 ? "torn" : "torns"}`}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${
        celebrating ? "animate-bounce" : ""
      }`}
      style={{ backgroundColor: tier.bg, color: tier.fg, borderColor: tier.fg }}
    >
      <span aria-hidden>{tier.emoji}</span>
      {tier.label}
      <span className="opacity-70">· {count}</span>
    </span>
  );
}
