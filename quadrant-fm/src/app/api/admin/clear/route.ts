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
  const { error } = await admin
    .from("slots")
    .update({ taken_by: null, taken_at: null })
    .not("taken_by", "is", null);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  await admin.from("slot_owner").delete().gte("slot_id", 0);
  return NextResponse.json({ ok: true });
}
