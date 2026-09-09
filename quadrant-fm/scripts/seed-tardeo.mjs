// Insereix els slots del Tardeo (301-352) a public.slots. Idempotent:
// ignoreDuplicates fa que re-executar no toqui les inscripcions existents, i
// el flag blocked es re-sincronitza només dins del rang 301-352.
// NO modifica cap fila d'FM (1-149) ni de Gatzara (201-251).
// Requereix que supabase/tardeo.sql ja s'hagi executat (columna blocked).
import { readFileSync, writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n").filter(Boolean)
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Backup de tot l'estat abans de tocar res.
const snapshot = await sb.from("slots").select("*").order("id");
if (snapshot.error) { console.error("ERROR backup:", snapshot.error.message); process.exit(1); }
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = `horari-backup-tardeo-${stamp}.json`;
writeFileSync(backup, JSON.stringify(snapshot.data, null, 1));
console.log("Backup desat:", backup, `(${snapshot.data.length} files)`);

const tardeo = JSON.parse(readFileSync("slots.json", "utf8")).filter((s) => s.event === "tardeo");
if (tardeo.length !== 52) {
  console.error("ERROR: slots.json té", tardeo.length, "places del Tardeo, n'esperava 52");
  process.exit(1);
}

const rows = tardeo.map((s) => ({
  id: s.id, table_name: s.table, block: s.block, time_label: s.time,
  tag: s.tag, color: s.color, col_pos: s.col, blocked: !!s.blocked,
}));

const beforeOthers = await sb.from("slots").select("id", { count: "exact", head: true }).lt("id", 301);

const { error } = await sb.from("slots").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
if (error) { console.error("ERROR insert:", error.message); process.exit(1); }

// Re-sincronitza només el flag blocked (mai taken_by), dins del rang del Tardeo.
for (const r of rows) {
  const { error: e } = await sb.from("slots").update({ blocked: r.blocked })
    .eq("id", r.id).gte("id", 301).lte("id", 352);
  if (e) { console.error("ERROR blocked", r.id, e.message); process.exit(1); }
}

const t = await sb.from("slots").select("id", { count: "exact", head: true }).gte("id", 301).lte("id", 352);
const b = await sb.from("slots").select("id", { count: "exact", head: true }).gte("id", 301).lte("id", 352).eq("blocked", true);
const afterOthers = await sb.from("slots").select("id", { count: "exact", head: true }).lt("id", 301);

console.log("Tardeo a BD:", t.count, "(esperat 52) · bloquejades:", b.count, "(esperat 26)");
console.log("Altres esdeveniments abans:", beforeOthers.count, "| després:", afterOthers.count, "(han de ser iguals)");
if (t.count !== 52 || b.count !== 26 || beforeOthers.count !== afterOthers.count) process.exit(1);
console.log("OK");
