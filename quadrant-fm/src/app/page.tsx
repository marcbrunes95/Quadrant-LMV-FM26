"use client";
import { useEffect, useState } from "react";
import { useSlots } from "@/hooks/useSlots";
import { computeStats, FM_COLS, FRIGO_COLS } from "@/lib/grid";
import { NameGate } from "@/components/NameGate";
import { Legend } from "@/components/Legend";
import { StatsBar } from "@/components/StatsBar";
import { ShiftGrid } from "@/components/ShiftGrid";

const NAME_KEY = "quadrant-fm-name";

export default function Home() {
  const [name, setName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const { slots, loading, error, claim, release } = useSlots();

  useEffect(() => {
    setName(localStorage.getItem(NAME_KEY));
    setReady(true);
  }, []);

  if (!ready) return null;
  if (!name) {
    return (
      <NameGate
        onEnter={(n) => { localStorage.setItem(NAME_KEY, n); setName(n); }}
      />
    );
  }

  const fm = slots.filter((s) => s.table === "FM");
  const frigo = slots.filter((s) => s.table === "FRIGO");
  const stats = computeStats(slots);

  return (
    <main className="min-h-screen bg-pink-50">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-pink-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 space-y-3">
          <div className="flex items-center justify-between gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/lamamave.png" alt="La Mama Ve" className="h-9" />
            <div className="text-sm text-gray-600">
              Hola, <strong className="text-pink-700">{name}</strong>{" "}
              <button
                onClick={() => { localStorage.removeItem(NAME_KEY); setName(null); }}
                className="underline text-gray-400 ml-1"
              >
                canviar
              </button>
            </div>
          </div>
          <StatsBar stats={stats} />
          <Legend />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {error && <p className="text-red-600 mb-4">Error: {error}</p>}
        {loading ? (
          <p className="text-gray-500">Carregant…</p>
        ) : (
          <>
            <ShiftGrid title="Prèvia i Festa Major" slots={fm} cols={FM_COLS}
              myName={name} onClaim={(id) => claim(id, name)} onRelease={(id) => release(id, name)} />
            <ShiftGrid title="Frigofiesta" slots={frigo} cols={FRIGO_COLS}
              myName={name} onClaim={(id) => claim(id, name)} onRelease={(id) => release(id, name)} />
          </>
        )}
      </div>
    </main>
  );
}
