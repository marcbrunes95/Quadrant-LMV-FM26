"use client";
import { useState } from "react";

export default function Admin() {
  const [key, setKey] = useState("");
  const [id, setId] = useState("");
  const [msg, setMsg] = useState("");

  async function release() {
    const r = await fetch("/api/admin/release", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, id: Number(id) }),
    });
    setMsg((await r.json()).ok ? `Plaça ${id} alliberada` : "Error / clau incorrecta");
  }
  async function clearAll() {
    if (!confirm("Segur que vols buidar TOTES les places?")) return;
    const r = await fetch("/api/admin/clear", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    setMsg((await r.json()).ok ? "Totes les places buidades" : "Error / clau incorrecta");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-xl shadow p-6 w-full max-w-sm space-y-3">
        <h1 className="font-bold text-lg">Admin · Quadrant FM</h1>
        <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="Clau d'admin"
          type="password" className="w-full border rounded px-3 py-2" />
        <div className="flex gap-2">
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="Nº plaça"
            className="flex-1 border rounded px-3 py-2" />
          <button onClick={release} className="bg-pink-600 text-white rounded px-4">Alliberar</button>
        </div>
        <button onClick={clearAll} className="w-full bg-red-600 text-white rounded py-2">Buidar-ho tot</button>
        {msg && <p className="text-sm text-gray-700">{msg}</p>}
      </div>
    </main>
  );
}
