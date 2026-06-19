"use client";
import { useState } from "react";

const PRIVACY_URL = "https://www.lamamave.com/legal/privacitat/politica";

export interface User {
  id: string;
  name: string;
}

export function NameGate({ onEnter }: { onEnter: (user: User) => void }) {
  const [id, setId] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = id.trim();
  const canEnter = trimmed.length > 0 && accepted && !loading;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canEnter) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: trimmed }),
      });
      const j = await r.json();
      if (r.ok && j.ok) {
        onEnter({ id: trimmed, name: j.name });
      } else if (r.status === 404) {
        setError("Aquest ID no surt a la llista de voluntaris. Revisa'l (sense espais).");
      } else {
        setError("Hi ha hagut un error. Torna-ho a provar en uns segons.");
      }
    } catch {
      setError("Sense connexió. Torna-ho a provar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-600 p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/lamamave.png" alt="La Mama Ve" className="mx-auto mb-6 w-48" />
        <h1 className="text-xl font-bold mb-4 text-gray-800">Quadrant Festa Major 2026</h1>
        <form onSubmit={submit}>
          <input
            autoFocus
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="El teu DNI / NIE sense lletra"
            autoComplete="off"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-3 text-center tracking-wide"
          />

          <label className="flex items-start gap-2 text-left text-xs text-gray-600 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-pink-600"
            />
            <span>
              Accepto la{" "}
              <a
                href={PRIVACY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-700 font-semibold underline"
              >
                Política de privacitat
              </a>{" "}
              de La Mama Ve i sóc conscient que el meu nom quedarà visible
              públicament al quadrant de voluntaris.
            </span>
          </label>

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          <button
            type="submit"
            disabled={!canEnter}
            className="w-full bg-pink-600 text-white font-semibold rounded-lg py-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Entrant…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
