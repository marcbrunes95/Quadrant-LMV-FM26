"use client";
import { useState } from "react";
import type { SlotEvent } from "@/lib/types";
import { formatWhen } from "@/lib/format";

export default function Admin() {
  const [key, setKey] = useState("");
  const [id, setId] = useState("");
  const [msg, setMsg] = useState("");
  const [events, setEvents] = useState<SlotEvent[] | null>(null);
  const [filter, setFilter] = useState("");

  async function release() {
    const r = await fetch("/api/admin/release", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, id: Number(id) }),
    });
    setMsg((await r.json()).ok ? `Plaça ${id} alliberada` : "Error / clau incorrecta");
    if (events) loadHistory();
  }

  async function clearAll() {
    if (!confirm("Segur que vols buidar TOTES les places?")) return;
    const r = await fetch("/api/admin/clear", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    setMsg((await r.json()).ok ? "Totes les places buidades" : "Error / clau incorrecta");
  }

  async function loadHistory() {
    const r = await fetch("/api/admin/history", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    const j = await r.json();
    if (j.ok) { setEvents(j.events); setMsg(""); }
    else { setMsg("Error / clau incorrecta"); }
  }

  function exportCsv() {
    if (!events) return;
    const rows = [
      ["data_hora", "accio", "placa", "persona"],
      ...events.map((e) => [e.created_at, e.action, String(e.slot_id), e.person]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "historial-quadrant-fm.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const shown = events?.filter((e) => {
    if (!filter.trim()) return true;
    const f = filter.toLowerCase();
    return e.person.toLowerCase().includes(f) || String(e.slot_id).includes(f);
  });

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <div className="bg-white rounded-xl shadow p-5 space-y-3">
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

        <div className="bg-white rounded-xl shadow p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold">Historial</h2>
            <div className="flex gap-2">
              <button onClick={loadHistory} className="bg-gray-800 text-white rounded px-3 py-1.5 text-sm">
                {events ? "Actualitzar" : "Carregar"}
              </button>
              {events && events.length > 0 && (
                <button onClick={exportCsv} className="bg-gray-200 text-gray-800 rounded px-3 py-1.5 text-sm">
                  Exportar CSV
                </button>
              )}
            </div>
          </div>

          {events && (
            <>
              <input value={filter} onChange={(e) => setFilter(e.target.value)}
                placeholder="Filtra per nom o nº plaça…"
                className="w-full border rounded px-3 py-2 text-sm" />
              <p className="text-xs text-gray-500">{shown?.length ?? 0} accions</p>
              <div className="max-h-[60vh] overflow-auto border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2">Quan</th>
                      <th className="text-left px-3 py-2">Acció</th>
                      <th className="text-left px-3 py-2">Plaça</th>
                      <th className="text-left px-3 py-2">Persona</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown?.map((e) => (
                      <tr key={e.id} className="border-t">
                        <td className="px-3 py-1.5 whitespace-nowrap text-gray-600">{formatWhen(e.created_at)}</td>
                        <td className="px-3 py-1.5">
                          <span className={e.action === "claim" ? "text-green-700" : "text-red-600"}>
                            {e.action === "claim" ? "Apuntat" : "Baixa"}
                          </span>
                        </td>
                        <td className="px-3 py-1.5">#{e.slot_id}</td>
                        <td className="px-3 py-1.5 font-medium">{e.person}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
