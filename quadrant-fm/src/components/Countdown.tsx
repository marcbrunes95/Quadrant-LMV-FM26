"use client";
import { useEffect, useState } from "react";
import { countdownParts, formatCountdown } from "@/lib/countdown";

/** Compte enrere informatiu. No tanca res: quan arriba l'hora, desapareix. */
export function Countdown({ target }: { target: string }) {
  // Es calcula només un cop muntat al navegador: si el servidor pintés una
  // hora i el client una altra, React avortaria la hidratació.
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const parts = countdownParts(target, new Date());
      setText(parts ? formatCountdown(parts) : null);
    };
    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, [target]);

  if (!text) return null;

  return (
    <p className="text-[11px] font-bold text-pink-700 bg-pink-50 rounded-full px-2.5 py-1 inline-block">
      <span aria-hidden>⏳</span> {text}
    </p>
  );
}
