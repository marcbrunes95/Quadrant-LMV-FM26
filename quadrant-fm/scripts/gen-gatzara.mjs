// Genera les 51 entrades Gatzara i les afegeix a slots.json (idempotent:
// si ja existeix l'id 201, no fa res). No toca cap entrada FM.
import { readFileSync, writeFileSync } from "fs";

const DJ = "Gatzara dijous 16/07";
const DV = "Gatzara divendres 17/07";
const BAR_COLS = ["N", "O", "P", "Q", "R", "S"];

// [numInicial, block, time, tag, colors per columna N..S]
const barra = [
  [1, DJ, "19:00", "Muntatge", ["blanc", "blanc", "blanc", "blanc", "blanc", "blanc"]],
  [7, DV, "11:00", "Muntatge", ["blanc", "blanc", "blanc", "blanc", "blanc", "blanc"]],
  [13, DV, "19:00-20:30", null, ["verd", "verd", "vermell", "roig", "verd", "verd"]],
  [19, DV, "20:30-22:00", null, ["verd", "verd", "vermell", "roig", "verd", "vermell"]],
  [25, DV, "22:00-23:30", null, ["verd", "verd", "vermell", "roig", "verd", "vermell"]],
  [31, DV, "23:30-1:00", null, ["verd", "vermell", "vermell", "roig", "vermell", "vermell"]],
  [37, DV, "1:00-2:30", null, ["verd", "vermell", "vermell", "roig", "vermell", "vermell"]],
];
// [num, time, tag, col, color] — ordre = ordre de visualització.
// Els rols (PATATERO, CUINA...) NO es mostren: tag null (només es manté Muntatge).
const cuina = [
  [46, "18:00-20:00", null, "Q", "verd"],
  [47, "18:00-20:00", null, "R", "verd"],
  [45, "18:00-22:00", null, "P", "roig"],
  [51, "18:00-0:00", null, "S", "vermell"],
  [43, "20:00-22:00", null, "N", "verd"],
  [44, "20:00-22:00", null, "O", "vermell"],
  [48, "20:00-22:00", null, "Q", "vermell"],
  [49, "20:00-22:00", null, "R", "vermell"],
  [50, "22:00-0:00", null, "N", "verd"],
];

const entries = [];
for (const [n0, block, time, tag, colors] of barra) {
  colors.forEach((color, i) => {
    const num = n0 + i;
    entries.push({ id: 200 + num, num, event: "gatzara", table: "GATZARA_BARRA",
      block, time, tag, color, col: BAR_COLS[i] });
  });
}
for (const [num, time, tag, col, color] of cuina) {
  entries.push({ id: 200 + num, num, event: "gatzara", table: "GATZARA_CUINA",
    block: DV, time, tag, color, col });
}

const path = "slots.json";
const existing = JSON.parse(readFileSync(path, "utf8"));
if (existing.some((s) => s.id === 201)) {
  console.log("Gatzara ja present; no es toca res.");
} else {
  writeFileSync(path, JSON.stringify([...existing, ...entries], null, 1));
  console.log("Afegides", entries.length, "entrades. Total:", existing.length + entries.length);
}
