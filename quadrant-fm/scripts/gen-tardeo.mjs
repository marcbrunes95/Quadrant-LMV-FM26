// Genera les 52 entrades del Tardeo i les afegeix a slots.json (idempotent:
// si ja existeix l'id 301, no fa res). No toca cap entrada FM ni Gatzara.
// Font: "Activitats tardeo.xlsx", pestanya Tardeo, rang M2:V15.
// Farciment #C27BA0 = plaça nostra · #666666 = plaça d'una altra colla.
import { readFileSync, writeFileSync } from "fs";

const DIA = "Dia 19/09";

// [time, tag, [[col, num, blocked], ...]] — l'ordre és el de visualització.
const rows = [
  ["10:30", "Muntatge", [["N", 1, 0], ["O", 2, 0], ["P", 3, 0], ["Q", 4, 1], ["R", 5, 1], ["S", 6, 1]]],
  ["19:00-21:00", null, [["N", 7, 0], ["O", 8, 1], ["P", 9, 1], ["Q", 10, 1], ["R", 11, 0], ["S", 12, 1], ["T", 13, 0], ["U", 14, 1]]],
  ["20:50-22:30", null, [["P", 15, 0], ["Q", 16, 0], ["R", 17, 1], ["S", 18, 0], ["T", 19, 0], ["U", 20, 1]]],
  ["22:20-00:00", null, [["P", 21, 1], ["Q", 22, 1], ["R", 23, 0], ["S", 24, 1], ["T", 25, 0], ["U", 26, 1]]],
  ["23:50-1:15", null, [["P", 27, 0], ["Q", 28, 0], ["R", 29, 1], ["S", 30, 0], ["T", 31, 0], ["U", 32, 1]]],
  ["1:05-2:30", null, [["P", 33, 1], ["Q", 34, 1], ["R", 35, 0], ["S", 36, 0], ["T", 37, 0], ["U", 38, 1]]],
  // Cel·la fusionada R11:R12 a l'Excel: cobreix les dues franges de cuina.
  ["18:00-22:00", null, [["R", 39, 1]]],
  ["18:00-20:00", null, [["S", 40, 0], ["T", 41, 1]]],
  ["20:00-22:00", null, [["P", 42, 1], ["Q", 43, 0], ["S", 44, 0], ["T", 45, 1]]],
  ["22:00-0:00", null, [["P", 46, 0]]],
  ["2:00-4:00", "Desmuntatge", [["N", 47, 0], ["O", 48, 0], ["P", 49, 0], ["Q", 50, 1], ["R", 51, 1], ["S", 52, 1]]],
];

const entries = [];
for (const [time, tag, cells] of rows) {
  for (const [col, num, blocked] of cells) {
    const entry = { id: 300 + num, num, event: "tardeo", table: "TARDEO",
      block: DIA, time, tag, color: "blanc", col };
    if (blocked) entry.blocked = true;
    entries.push(entry);
  }
}

if (entries.length !== 52) {
  console.error("ERROR: s'esperaven 52 places, n'hi ha", entries.length);
  process.exit(1);
}

const slots = JSON.parse(readFileSync("slots.json", "utf8"));
if (slots.some((s) => s.id === 301)) {
  console.log("Ja hi són: no faig res.");
  process.exit(0);
}
writeFileSync("slots.json", JSON.stringify([...slots, ...entries], null, 1) + "\n");
console.log("Afegides", entries.length, "places del Tardeo. Total:", slots.length + entries.length);
