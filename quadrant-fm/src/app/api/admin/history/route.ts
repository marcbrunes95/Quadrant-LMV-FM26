import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { key } = await req.json();
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || key !== adminKey) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data, error } = await admin
    .from("slot_events")
    .select("id, slot_id, person, action, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, events: data });
}
