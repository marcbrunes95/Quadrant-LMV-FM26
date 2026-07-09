"use client";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSlots } from "@/hooks/useSlots";
import { computeStats } from "@/lib/grid";
import type { EventConfig } from "@/lib/events";
import type { Slot } from "@/lib/types";
import { NameGate, type User } from "@/components/NameGate";
import { Legend } from "@/components/Legend";
import { StatsBar } from "@/components/StatsBar";
import { ShiftGrid } from "@/components/ShiftGrid";
import { MedalBadge } from "@/components/MedalBadge";
import { Confetti } from "@/components/Confetti";

const USER_KEY = "quadrant-fm-user";

export function EventPage({ config }: { config: EventConfig }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const infoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { slots, loading, error, claim, release, mineIds, mineReady } =
    useSlots(user?.id ?? null, config.event);

  const showInfo = useCallback((msg: string) => {
    setInfo(msg);
    if (infoTimer.current) clearTimeout(infoTimer.current);
    infoTimer.current = setTimeout(() => setInfo(null), 3500);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (raw) setUser(JSON.parse(raw) as User);
    } catch { /* ignore corrupt value */ }
    setReady(true);
  }, []);

  // Ids d'aquest esdeveniment: medalles i comptadors NOMÉS d'aquí.
  const eventIds = useMemo(() => new Set(slots.map((s) => s.id)), [slots]);

  // How many slots the current person holds — by ID (DNI) when available.
  const myName = user?.name ?? null;
  const myCount = mineReady
    ? [...mineIds].filter((id) => eventIds.has(id)).length
    : (myName ? slots.filter((s) => s.taken_by === myName).length : 0);
  const prevCount = useRef<number | null>(null);
  const baselined = useRef(false);
  const [celebrating, setCelebrating] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const t = config.medal;

  useEffect(() => {
    if (loading || !myName) return;
    if (!baselined.current) { prevCount.current = myCount; baselined.current = true; return; }
    const prev = prevCount.current;
    if (prev !== null && myCount > prev) {
      const reachedOr = prev < t.or && myCount >= t.or;
      const reachedPlata = prev < t.plata && myCount >= t.plata;
      const reachedBronze = prev < t.bronze && myCount >= t.bronze;
      const msg =
        reachedOr ? `Ja ets OR! 🥇 Gràcies per col·laborar amb La Mama Ve fins a ${t.or} vegades durant aquesta ${config.name}!` :
        reachedPlata ? `Ja ets PLATA! 🥈 Gràcies per col·laborar amb La Mama Ve fins a ${t.plata} vegades durant aquesta ${config.name}!` :
        reachedBronze ? `Ja ets BRONZE! 🥉 Gràcies per col·laborar amb La Mama Ve durant aquesta ${config.name}!` :
        `Genial! Ja portes ${myCount} torns 🎉`;
      showInfo(msg);
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 2600);
      // Serpentines en assolir PLATA o OR
      if (reachedPlata || reachedOr) {
        setConfetti(true);
        setTimeout(() => setConfetti(false), 4000);
      }
    }
    prevCount.current = myCount;
  }, [loading, myName, myCount, showInfo, t, config.name]);

  if (!ready) return null;
  if (!user) {
    return (
      <NameGate
        onEnter={(u) => { localStorage.setItem(USER_KEY, JSON.stringify(u)); setUser(u); }}
      />
    );
  }

  const name = user.name;

  // Ownership strictly by ID (DNI); name match is only a temporary fallback
  // until the my_slots RPC is deployed.
  const isMine = (slot: Slot) =>
    mineReady ? mineIds.has(slot.id) : slot.taken_by === name;

  const handleClaim = (slotId: number) => {
    claim(slotId, name, user.id).then((status) => {
      if (status === "dup") showInfo("Ja tens una plaça en aquesta franja horària");
      else if (status === "taken") showInfo("Aquesta plaça l'acaba d'agafar algú altre");
    });
  };

  const stats = computeStats(slots);

  return (
    <main className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 backdrop-blur border-b border-pink-100 shadow-sm" style={{ backgroundColor: "rgba(245,245,245,0.95)" }}>
        <div className="max-w-6xl mx-auto px-3 py-2 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/lamamave.png" alt="La Mama Ve" className="h-7" />
              <Link href="/" className="text-xs text-gray-400 underline shrink-0">
                ← esdeveniments
              </Link>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>Hola, <strong className="text-pink-700">{name}</strong></span>
              <MedalBadge count={myCount} celebrating={celebrating} thresholds={t} />
              <button
                onClick={() => { localStorage.removeItem(USER_KEY); setUser(null); }}
                className="underline text-gray-400"
              >
                surt
              </button>
            </div>
          </div>
          <StatsBar stats={stats} />
          <div className="flex items-start justify-between gap-3">
            <Legend />
            {config.programPdf && (
              <a
                href={config.programPdf}
                target="_blank"
                rel="noopener noreferrer"
                title="Descarrega el programa de Festa Major"
                className="shrink-0 inline-flex items-center gap-1 rounded-full bg-pink-600 text-white text-[11px] font-semibold px-2.5 py-1 hover:bg-pink-700"
              >
                <span aria-hidden>📄</span> Programa
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-3 py-4">
        {error && <p className="text-red-600 mb-4">Error: {error}</p>}
        {loading ? (
          <p className="text-gray-500">Carregant…</p>
        ) : (
          <>
            {config.grids.map((g) => (
              <ShiftGrid key={g.table} title={g.title}
                slots={slots.filter((s) => s.table === g.table)} cols={g.cols}
                isMine={isMine} onClaim={handleClaim}
                onRelease={(id) => release(id, name, user.id)} onInfo={showInfo} />
            ))}
          </>
        )}
      </div>

      {info && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-[min(92vw,28rem)] rounded-2xl bg-gray-900 text-white text-sm text-center leading-snug px-4 py-3 shadow-lg">
          {info}
        </div>
      )}

      {confetti && <Confetti />}
    </main>
  );
}
