import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Escriu (o esborra) el nom d'una plaça que cobreix una altra colla.
// El filtre blocked=true és la barrera: des d'aquí no s'ha de poder trepitjar
// mai una inscripció real de La Mama Ve.
export async function POST(req: Request) {
  const { key, id, name } = await req.json();
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || key !== adminKey) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const slotId = Number(id);
  if (!Number.isInteger(slotId)) {
    return NextResponse.json({ ok: false, error: "Número de plaça no vàlid" }, { status: 400 });
  }
  const person = typeof name === "string" ? name.trim() : "";

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data, error } = await admin
    .from("slots")
    .update({
      taken_by: person || null,
      taken_at: person ? new Date().toISOString() : null,
    })
    .eq("id", slotId)
    .eq("blocked", true)
    .select("id");

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Aquesta plaça no existeix o no és d'una altra colla" },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
