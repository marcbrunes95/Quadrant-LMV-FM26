"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { SLOTS_META } from "@/lib/slots-data";
import type { Slot, SlotState } from "@/lib/types";

type TakenInfo = { by: string | null; at: string | null };

function merge(state: Record<number, TakenInfo>): Slot[] {
  return SLOTS_META.map((m) => ({
    ...m,
    taken_by: state[m.id]?.by ?? null,
    taken_at: state[m.id]?.at ?? null,
  }));
}

export function useSlots(externalId: string | null) {
  const [taken, setTaken] = useState<Record<number, TakenInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Which slot ids belong to ME — resolved by ID (DNI), never by name.
  const [mineIds, setMineIds] = useState<Set<number>>(new Set());
  const [mineReady, setMineReady] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("slots")
      .select("id, taken_by, taken_at")
      .order("id");
    if (error) { setError(error.message); setLoading(false); return; }
    const map: Record<number, TakenInfo> = {};
    (data as SlotState[]).forEach((r) => { map[r.id] = { by: r.taken_by, at: r.taken_at }; });
    setTaken(map);
    setLoading(false);
  }, []);

  const loadMine = useCallback(async () => {
    if (!externalId) { setMineIds(new Set()); setMineReady(true); return; }
    const { data, error } = await supabase.rpc("my_slots", { p_external_id: externalId });
    if (error || !Array.isArray(data)) {
      // RPC not deployed yet → leave unready so the UI can fall back temporarily.
      setMineReady(false);
      return;
    }
    setMineIds(new Set(data as number[]));
    setMineReady(true);
  }, [externalId]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`slots-changes-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "slots" },
        (payload) => {
          const row = payload.new as SlotState;
          setTaken((prev) => ({ ...prev, [row.id]: { by: row.taken_by, at: row.taken_at } }));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  useEffect(() => { loadMine(); }, [loadMine]);

  // Returns: "ok" | "dup" (already has one in this franja) | "taken" (lost race) | "error"
  const claim = useCallback(async (id: number, person: string, extId: string): Promise<string> => {
    const { data, error } = await supabase.rpc("claim_slot", { p_id: id, p_person: person, p_external_id: extId });
    if (error) { setError(error.message); return "error"; }
    const ok = data === true || data === "ok"; // tolerate old (boolean) and new (text) RPC
    if (ok) {
      setTaken((prev) => ({ ...prev, [id]: { by: person, at: new Date().toISOString() } }));
      setMineIds((prev) => new Set(prev).add(id));
      return "ok";
    }
    if (data === "dup") return "dup";
    await load(); // lost the race; refresh truth
    return "taken";
  }, [load]);

  const release = useCallback(async (id: number, person: string, extId: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc("release_slot", { p_id: id, p_person: person, p_external_id: extId });
    if (error) { setError(error.message); return false; }
    if (data === true) {
      setTaken((prev) => ({ ...prev, [id]: { by: null, at: null } }));
      setMineIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
    return data === true;
  }, []);

  return { slots: merge(taken), loading, error, claim, release, mineIds, mineReady };
}
