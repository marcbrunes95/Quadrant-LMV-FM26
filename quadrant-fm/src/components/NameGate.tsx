"use client";
import { useState } from "react";

const PRIVACY_URL = "https://www.lamamave.com/legal/privacitat/politica";

export function NameGate({ onEnter }: { onEnter: (name: string) => void }) {
  const [name, setName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const trimmed = name.trim();
  const canEnter = trimmed.length > 0 && accepted;

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-600 p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/lamamave.png" alt="La Mama Ve" className="mx-auto mb-6 w-48" />
        <h1 className="text-xl font-bold mb-4 text-gray-800">Quadrant Festa Major 2026</h1>
        <form
          onSubmit={(e) => { e.preventDefault(); if (canEnter) onEnter(trimmed); }}
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="El teu nom"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 text-center"
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

          <button
            type="submit"
            disabled={!canEnter}
            className="w-full bg-pink-600 text-white font-semibold rounded-lg py-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
