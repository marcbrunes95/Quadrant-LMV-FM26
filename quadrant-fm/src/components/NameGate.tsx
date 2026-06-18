"use client";
import { useState } from "react";

export function NameGate({ onEnter }: { onEnter: (name: string) => void }) {
  const [name, setName] = useState("");
  const trimmed = name.trim();
  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-600 p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/lamamave.png" alt="La Mama Ve" className="mx-auto mb-6 w-48" />
        <h1 className="text-xl font-bold mb-4 text-gray-800">Quadrant Festa Major 2026</h1>
        <form
          onSubmit={(e) => { e.preventDefault(); if (trimmed) onEnter(trimmed); }}
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="El teu nom"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 text-center"
          />
          <button
            type="submit"
            disabled={!trimmed}
            className="w-full bg-pink-600 text-white font-semibold rounded-lg py-3 disabled:opacity-40"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
