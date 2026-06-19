"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useSlots } from "@/hooks/useSlots";
import { computeStats, FM_COLS, FRIGO_COLS } from "@/lib/grid";
import { NameGate, type User } from "@/components/NameGate";
import { Legend } from "@/components/Legend";
import { StatsBar } from "@/components/StatsBar";
import { ShiftGrid } from "@/components/ShiftGrid";

const USER_KEY = "quadrant-fm-user";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const infoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { slots, loading, error, claim, release } = useSlots();

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

  if (!ready) return null;
  if (!user) {
    return (
      <NameGate
        onEnter={(u) => { localStorage.setItem(USER_KEY, JSON.stringify(u)); setUser(u); }}
      />
    );
  }

  const name = user.name;

  const fm = slots.filter((s) => s.table === "FM");
  const frigo = slots.filter((s) => s.table === "FRIGO");
  const stats = computeStats(slots);

  return (
    <main className="min-h-screen bg-pink-50">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-pink-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-3 py-2 space-y-2">
          <div className="flex items-center justify-between gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/lamamave.png" alt="La Mama Ve" className="h-7" />
            <div className="text-xs text-gray-600">
              Hola, <strong className="text-pink-700">{name}</strong>{" "}
              <button
                onClick={() => { localStorage.removeItem(USER_KEY); setUser(null); }}
                className="underline text-gray-400 ml-1"
              >
                surt
              </button>
            </div>
          </div>
          <StatsBar stats={stats} />
          <div className="flex items-start justify-between gap-3">
            <Legend />
            <a
              href="/Programa_Festa_Major_2026.pdf"
              target="_blank"
              rel="noopener noreferrer"
              title="Descarrega el programa de Festa Major"
              className="shrink-0 inline-flex items-center gap-1 rounded-full bg-pink-600 text-white text-[11px] font-semibold px-2.5 py-1 hover:bg-pink-700"
            >
              <span aria-hidden>📄</span> Programa
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-3 py-4">
        {error && <p className="text-red-600 mb-4">Error: {error}</p>}
        {loading ? (
          <p className="text-gray-500">Carregant…</p>
        ) : (
          <>
            <ShiftGrid title="Prèvia i Festa Major" slots={fm} cols={FM_COLS}
              myName={name} onClaim={(id) => claim(id, name, user.id)} onRelease={(id) => release(id, name, user.id)} onInfo={showInfo} />
            <ShiftGrid title="Frigofiesta" slots={frigo} cols={FRIGO_COLS}
              myName={name} onClaim={(id) => claim(id, name, user.id)} onRelease={(id) => release(id, name, user.id)} onInfo={showInfo} />
          </>
        )}
      </div>

      {info && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 max-w-[90vw] rounded-full bg-gray-900 text-white text-sm px-4 py-2 shadow-lg">
          {info}
        </div>
      )}
    </main>
  );
}
