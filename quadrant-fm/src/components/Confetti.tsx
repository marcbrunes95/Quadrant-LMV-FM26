"use client";

const COLORS = ["#fa3c92", "#3d001c", "#ffd700", "#ffec99", "#ff8fc7", "#a37e00", "#ffffff"];

export function Confetti() {
  const pieces = Array.from({ length: 90 });
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.7;
        const dur = 2.6 + Math.random() * 1.8;
        const w = 5 + Math.random() * 5;
        const h = 12 + Math.random() * 16;
        const color = COLORS[i % COLORS.length];
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              top: "-24px",
              left: `${left}%`,
              width: `${w}px`,
              height: `${h}px`,
              backgroundColor: color,
              borderRadius: "2px",
              opacity: 0.9,
              animation: `confetti-fall ${dur}s linear ${delay}s forwards`,
            }}
          />
        );
      })}
    </div>
  );
}
