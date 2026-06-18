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

export function useSlots() {
  const [taken, setTaken] = useState<Record<number, TakenInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const claim = useCallback(async (id: number, person: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc("claim_slot", { p_id: id, p_person: person });
    if (error) { setError(error.message); return false; }
    if (data === true) setTaken((prev) => ({ ...prev, [id]: { by: person, at: new Date().toISOString() } }));
    else await load(); // lost the race; refresh truth
    return data === true;
  }, [load]);

  const release = useCallback(async (id: number, person: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc("release_slot", { p_id: id, p_person: person });
    if (error) { setError(error.message); return false; }
    if (data === true) setTaken((prev) => ({ ...prev, [id]: { by: null, at: null } }));
    return data === true;
  }, []);

  return { slots: merge(taken), loading, error, claim, release };
}
