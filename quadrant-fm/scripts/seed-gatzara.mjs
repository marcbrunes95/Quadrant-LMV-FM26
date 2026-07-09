// Insereix els slots Gatzara (201-251) a public.slots. Idempotent:
// ignoreDuplicates fa que re-executar no toqui res. NO modifica files FM.
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n").filter(Boolean)
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const rows = JSON.parse(readFileSync("slots.json", "utf8"))
  .filter((s) => s.event === "gatzara")
  .map((s) => ({ id: s.id, table_name: s.table, block: s.block, time_label: s.time,
    tag: s.tag, color: s.color, col_pos: s.col }));

const before = await sb.from("slots").select("id", { count: "exact", head: true }).lte("id", 149);
const { error } = await sb.from("slots").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
if (error) { console.error("ERROR:", error.message); process.exit(1); }
const g = await sb.from("slots").select("id", { count: "exact", head: true }).gte("id", 201).lte("id", 251);
const after = await sb.from("slots").select("id", { count: "exact", head: true }).lte("id", 149);
console.log("Gatzara a BD:", g.count, "(esperat 51)");
console.log("FM abans:", before.count, "| FM després:", after.count, "(han de ser iguals)");
if (g.count !== 51 || before.count !== after.count) process.exit(1);
console.log("OK");
