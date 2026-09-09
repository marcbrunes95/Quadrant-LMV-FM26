# Tardeo final d'estiu — pla d'implementació

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar a `/tardeo` el quadrant del Tardeo final d'estiu (dissabte 19/09/2026), amb 26 places obertes a La Mama Ve, 26 places bloquejades d'una altra colla que no compten al percentatge, i un compte enrere informatiu.

**Architecture:** Es reutilitza la maquinària d'esdeveniments que ja existeix (`EventConfig` + `EventPage` + `slots.json` estàtic + taula `slots` dinàmica). S'hi afegeixen dues capacitats transversals: un camp `blocked` a la metadata i a la BD, respectat també per l'RPC `claim_slot`, i un compte enrere opcional per esdeveniment.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS 4, Supabase (Postgres + RPC), Vitest + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-09-09-tardeo-event-design.md`

## Global Constraints

- Totes les comandes s'executen des de `quadrant-fm/`.
- **MAI** modificar les entrades FM (ids 1-149) ni Gatzara (ids 201-251), ni cap inscripció existent.
- **MAI** `git push` (push = deploy a producció). El pla acaba amb commits locals.
- **MAI** escriure a la BD de producció sense OK explícit de Marc; abans de qualsevol escriptura, backup JSON.
- Ids del Tardeo: **301-352**, sempre `id = 300 + num`. El `num` (1-52) és el que veu la gent; l'`id` mana internament.
- Metadata estàtica a `quadrant-fm/slots.json`; la BD només mana en `taken_by` / `taken_at`.
- Seeds i migracions **idempotents**, re-executables sense perill.
- UI en català; codi, noms i comentaris en anglès. Els comentaris expliquen el *perquè*.
- Paleta: `#fa3c92` principal, `#ffebf4` fons targetes, `#3d001c` fosc, `#666666` places bloquejades.
- Commits: `tipus: missatge en català`, petits i temàtics.
- Porta de qualitat abans de donar res per fet: `npm test && npx tsc --noEmit && npm run build`.

---

### Task 1: Tipus i metadata de les 52 places

**Files:**
- Modify: `quadrant-fm/src/lib/types.ts`
- Create: `quadrant-fm/scripts/gen-tardeo.mjs`
- Modify: `quadrant-fm/slots.json` (el genera l'script, mai a mà)
- Test: `quadrant-fm/src/lib/__tests__/slots-data.test.ts`

**Interfaces:**
- Consumes: `slotsForEvent(event: EventId): SlotMeta[]` de `src/lib/slots-data.ts` (ja existeix).
- Produces: `EventId` inclou `"tardeo"`; `TableName` inclou `"TARDEO"`; `SlotMeta.blocked?: boolean`. 52 entrades a `slots.json` amb `event: "tardeo"`, ids 301-352.

- [ ] **Step 1: Escriu el test que falla**

Afegeix al final de `quadrant-fm/src/lib/__tests__/slots-data.test.ts`:

```ts
describe("slots-data (Tardeo)", () => {
  const t = slotsForEvent("tardeo");
  const byNum = new Map(t.map((s) => [s.num, s]));

  it("52 places, ids 301-352 = 300 + num", () => {
    expect(t).toHaveLength(52);
    expect(t.every((s) => s.id === 300 + (s.num ?? 0))).toBe(true);
    expect(new Set(t.map((s) => s.id)).size).toBe(52);
    expect(Math.min(...t.map((s) => s.id))).toBe(301);
    expect(Math.max(...t.map((s) => s.id))).toBe(352);
  });

  it("un sol bloc, una sola taula, tot color blanc", () => {
    expect(new Set(t.map((s) => s.block))).toEqual(new Set(["Dia 19/09"]));
    expect(t.every((s) => s.table === "TARDEO")).toBe(true);
    expect(t.every((s) => s.color === "blanc")).toBe(true);
  });

  it("només Muntatge i Desmuntatge porten tag; cap nom de rol", () => {
    expect(byNum.get(1)?.tag).toBe("Muntatge");
    expect(byNum.get(52)?.tag).toBe("Desmuntatge");
    expect(byNum.get(7)?.tag).toBeNull();
    expect(byNum.get(43)?.tag).toBeNull();
  });

  it("26 places bloquejades i 26 obertes, segons el full d'Excel", () => {
    const blocked = t.filter((s) => s.blocked).map((s) => s.num!).sort((a, b) => a - b);
    expect(blocked).toEqual([
      4, 5, 6, 8, 9, 10, 12, 14, 17, 20, 21, 22, 24, 26,
      29, 32, 33, 34, 38, 39, 41, 42, 45, 50, 51, 52,
    ]);
    expect(t.filter((s) => !s.blocked)).toHaveLength(26);
  });

  it("la 39 (cap de cuina, cel·la fusionada) té franja pròpia 18:00-22:00", () => {
    expect(byNum.get(39)).toMatchObject({ time: "18:00-22:00", blocked: true, col: "R" });
  });

  it("les places surten en ordre de número", () => {
    expect(t.map((s) => s.num)).toEqual([...Array(52)].map((_, i) => i + 1));
  });
});
```

Al test existent «FM queda intacte», actualitza el total de la metadata (149 FM + 51 Gatzara + 52 Tardeo):

```ts
    expect(SLOTS_META).toHaveLength(252);
```

- [ ] **Step 2: Executa el test i comprova que falla**

Run: `npm test -- slots-data`
Expected: FAIL. TypeScript es queixa que `"tardeo"` no és assignable a `EventId`, i el recompte de 252 no quadra.

- [ ] **Step 3: Amplia els tipus**

A `quadrant-fm/src/lib/types.ts`, substitueix les dues línies de tipus:

```ts
export type TableName = "FM" | "FRIGO" | "GATZARA_BARRA" | "GATZARA_CUINA" | "TARDEO";
export type EventId = "fm" | "gatzara" | "tardeo";
```

I dins de `SlotMeta`, just després del camp `num`:

```ts
  /** Plaça que cobreix una altra colla: ni es pot agafar ni compta al nostre %. */
  blocked?: boolean;
```

- [ ] **Step 4: Escriu el generador de metadata**

Crea `quadrant-fm/scripts/gen-tardeo.mjs`:

```js
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
```

- [ ] **Step 5: Executa el generador i comprova que és idempotent**

Run: `node scripts/gen-tardeo.mjs`
Expected: `Afegides 52 places del Tardeo. Total: 252`

Run (segon cop): `node scripts/gen-tardeo.mjs`
Expected: `Ja hi són: no faig res.`

- [ ] **Step 6: Executa els tests i comprova que passen**

Run: `npm test -- slots-data`
Expected: PASS, tant els d'FM i Gatzara com els nous del Tardeo.

- [ ] **Step 7: Commit**

```bash
git add src/lib/types.ts scripts/gen-tardeo.mjs slots.json src/lib/__tests__/slots-data.test.ts
git commit -m "feat(tardeo): metadata de les 52 places i camp blocked"
```

---

### Task 2: Columnes i percentatge que ignora les places bloquejades

**Files:**
- Modify: `quadrant-fm/src/lib/grid.ts`
- Test: `quadrant-fm/src/lib/__tests__/grid.test.ts`

**Interfaces:**
- Consumes: `SlotMeta.blocked` de la Task 1.
- Produces: `TARDEO_COLS: string[]` exportat de `src/lib/grid.ts`. `computeStats(slots: Slot[]): Stats` deixa de comptar les places amb `blocked`.

- [ ] **Step 1: Escriu els tests que fallen**

A `quadrant-fm/src/lib/__tests__/grid.test.ts`, actualitza la línia d'import de dalt del fitxer:

```ts
import { buildGrid, computeStats, FM_COLS, FRIGO_COLS, GATZARA_COLS, TARDEO_COLS } from "../grid";
```

Afegeix aquests dos tests dins del `describe("computeStats", ...)`:

```ts
  it("no compta les places bloquejades ni al total ni als lliures", () => {
    const slots: Slot[] = [
      slot({ id: 1, taken_by: null }),
      slot({ id: 2, taken_by: "Marc" }),
      slot({ id: 3, blocked: true, taken_by: null }),
      slot({ id: 4, blocked: true, taken_by: "Altra colla" }),
    ];
    const st = computeStats(slots);
    expect(st.total).toBe(2);
    expect(st.free).toBe(1);
    expect(st.byBlock).toEqual([{ block: "B1", free: 1, total: 2 }]);
  });

  it("un bloc només amb places bloquejades no surt al detall per torns", () => {
    const slots: Slot[] = [
      slot({ id: 1, block: "B1", taken_by: null }),
      slot({ id: 2, block: "B2", blocked: true, taken_by: null }),
    ];
    const st = computeStats(slots);
    expect(st.byBlock.map((b) => b.block)).toEqual(["B1"]);
    expect(st.total).toBe(1);
  });
```

I afegeix aquest `describe` nou al final del fitxer:

```ts
describe("TARDEO_COLS", () => {
  it("cobreix les 8 columnes d'Excel que fa servir el Tardeo", () => {
    expect(TARDEO_COLS).toEqual(["N", "O", "P", "Q", "R", "S", "T", "U"]);
  });
});
```

- [ ] **Step 2: Executa els tests i comprova que fallen**

Run: `npm test -- grid`
Expected: FAIL. `TARDEO_COLS` no existeix i `st.total` val 4 en comptes de 2.

- [ ] **Step 3: Implementa el canvi**

A `quadrant-fm/src/lib/grid.ts`, afegeix la constant just després de `GATZARA_COLS`:

```ts
export const TARDEO_COLS = ["N", "O", "P", "Q", "R", "S", "T", "U"];
```

I substitueix `computeStats` sencera per:

```ts
export function computeStats(slots: Slot[]): Stats {
  let free = 0;
  let total = 0;
  const order: string[] = [];
  const map = new Map<string, BlockStat>();
  for (const s of slots) {
    // Les places que cobreix una altra colla no són nostres: si comptessin,
    // el percentatge de la colla sortiria diluït.
    if (s.blocked) continue;
    total++;
    if (s.taken_by === null) free++;
    let bs = map.get(s.block);
    if (!bs) {
      bs = { block: s.block, free: 0, total: 0 };
      map.set(s.block, bs);
      order.push(s.block);
    }
    bs.total++;
    if (s.taken_by === null) bs.free++;
  }
  return { free, total, byBlock: order.map((b) => map.get(b)!) };
}
```

- [ ] **Step 4: Executa els tests i comprova que passen**

Run: `npm test -- grid`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/grid.ts src/lib/__tests__/grid.test.ts
git commit -m "feat(tardeo): columnes TARDEO i % que ignora les places d'una altra colla"
```

---

### Task 3: Fixar amb tests els solapaments horaris del 19/09

No cal tocar `src/lib/franja.ts`: la lògica d'hores de matinada ja hi és i funciona. Aquesta tasca només fixa el comportament real d'aquest quadrant, perquè si algú retoca `franja.ts` es vegi de seguida què es trenca.

**Files:**
- Test: `quadrant-fm/src/lib/__tests__/franja.test.ts`

**Interfaces:**
- Consumes: `findOverlap(target: SlotMeta, mine: SlotMeta[]): SlotMeta | null` de `src/lib/franja.ts`; `slotsForEvent("tardeo")` de la Task 1.
- Produces: res de nou.

- [ ] **Step 1: Escriu els tests**

A `quadrant-fm/src/lib/__tests__/franja.test.ts`, afegeix aquest import a dalt del fitxer, amb els altres:

```ts
import { slotsForEvent } from "../slots-data";
```

I afegeix aquest `describe` al final del fitxer:

```ts
describe("solapaments reals del Tardeo (Dia 19/09)", () => {
  const tardeo = slotsForEvent("tardeo");
  const p = (num: number) => tardeo.find((s) => s.num === num)!;

  it("cuina 18:00-20:00 xoca amb barra 19:00-21:00", () => {
    expect(findOverlap(p(40), [p(7)])?.num).toBe(7);
  });

  it("cuina 20:00-22:00 xoca amb barra 20:50-22:30", () => {
    expect(findOverlap(p(43), [p(16)])?.num).toBe(16);
  });

  it("l'últim torn de barra xoca amb el desmuntatge", () => {
    expect(findOverlap(p(35), [p(47)])?.num).toBe(47);
  });

  it("el cap de cuina 18:00-22:00 xoca amb les dues franges de cuina", () => {
    expect(findOverlap(p(39), [p(40)])?.num).toBe(40);
    expect(findOverlap(p(39), [p(44)])?.num).toBe(44);
  });

  it("22:20-00:00 i 23:50-1:15 se solapen tot i creuar la mitjanit", () => {
    expect(findOverlap(p(23), [p(27)])?.num).toBe(27);
  });

  it("el muntatge de les 10:30 no té rang i no bloqueja res", () => {
    expect(findOverlap(p(1), [p(7), p(47)])).toBeNull();
  });

  it("dues franges consecutives que només es toquen no xoquen", () => {
    // 18:00-20:00 acaba just quan comença 20:00-22:00.
    expect(findOverlap(p(40), [p(43)])).toBeNull();
  });
});
```

- [ ] **Step 2: Executa els tests**

Run: `npm test -- franja`
Expected: PASS a la primera. Si algun falla, vol dir que la metadata de la Task 1 té una franja mal escrita: arregla-la allà, no aquí.

- [ ] **Step 3: Commit**

```bash
git add src/lib/__tests__/franja.test.ts
git commit -m "test(tardeo): fixa els solapaments horaris del 19/09"
```

---

### Task 4: Lògica del compte enrere

**Files:**
- Create: `quadrant-fm/src/lib/countdown.ts`
- Test: `quadrant-fm/src/lib/__tests__/countdown.test.ts`

**Interfaces:**
- Consumes: res.
- Produces:
  - `interface CountdownParts { days: number; hours: number; minutes: number }`
  - `countdownParts(targetIso: string, now: Date): CountdownParts | null`
  - `formatCountdown(p: CountdownParts): string`

- [ ] **Step 1: Escriu el test que falla**

Crea `quadrant-fm/src/lib/__tests__/countdown.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { countdownParts, formatCountdown } from "../countdown";

const TARGET = "2026-09-19T19:00:00+02:00"; // = 17:00 UTC

describe("countdownParts", () => {
  it("desglossa dies, hores i minuts", () => {
    expect(countdownParts(TARGET, new Date("2026-09-09T17:00:00Z")))
      .toEqual({ days: 10, hours: 0, minutes: 0 });
    expect(countdownParts(TARGET, new Date("2026-09-19T13:25:00Z")))
      .toEqual({ days: 0, hours: 3, minutes: 35 });
    expect(countdownParts(TARGET, new Date("2026-09-18T16:30:00Z")))
      .toEqual({ days: 1, hours: 0, minutes: 30 });
  });

  it("retorna null just a l'hora i quan ja ha passat", () => {
    expect(countdownParts(TARGET, new Date("2026-09-19T17:00:00Z"))).toBeNull();
    expect(countdownParts(TARGET, new Date("2026-09-20T10:00:00Z"))).toBeNull();
  });

  it("interpreta l'objectiu com un instant absolut, no com una hora local", () => {
    const a = countdownParts("2026-09-19T19:00:00+02:00", new Date("2026-09-19T16:00:00Z"));
    const b = countdownParts("2026-09-19T17:00:00Z", new Date("2026-09-19T16:00:00Z"));
    expect(a).toEqual(b);
    expect(a).toEqual({ days: 0, hours: 1, minutes: 0 });
  });

  it("retorna null si la data no és vàlida", () => {
    expect(countdownParts("no és una data", new Date("2026-01-01T00:00:00Z"))).toBeNull();
  });
});

describe("formatCountdown", () => {
  it("escriu el text en català segons la magnitud", () => {
    expect(formatCountdown({ days: 10, hours: 4, minutes: 3 })).toBe("Falten 10 dies i 4 h");
    expect(formatCountdown({ days: 10, hours: 0, minutes: 3 })).toBe("Falten 10 dies");
    expect(formatCountdown({ days: 1, hours: 0, minutes: 0 })).toBe("Falta 1 dia");
    expect(formatCountdown({ days: 0, hours: 3, minutes: 35 })).toBe("Falten 3 h 35 min");
    expect(formatCountdown({ days: 0, hours: 0, minutes: 12 })).toBe("Falten 12 min");
    expect(formatCountdown({ days: 0, hours: 0, minutes: 0 })).toBe("Comença ara!");
  });
});
```

- [ ] **Step 2: Executa el test i comprova que falla**

Run: `npm test -- countdown`
Expected: FAIL, no es pot resoldre el mòdul `../countdown`.

- [ ] **Step 3: Implementa**

Crea `quadrant-fm/src/lib/countdown.ts`:

```ts
export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
}

/**
 * Temps que falta fins a `targetIso` (ISO amb zona, p. ex. "…T19:00:00+02:00").
 * Retorna null si la data no és vàlida o si l'instant ja ha passat.
 */
export function countdownParts(targetIso: string, now: Date): CountdownParts | null {
  const target = new Date(targetIso).getTime();
  if (Number.isNaN(target)) return null;
  const ms = target - now.getTime();
  if (ms <= 0) return null;
  const totalMinutes = Math.floor(ms / 60_000);
  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
  };
}

/** Text curt en català; només baixa al detall quan queda poc temps. */
export function formatCountdown(p: CountdownParts): string {
  if (p.days > 0) {
    const dies = p.days === 1 ? "Falta 1 dia" : `Falten ${p.days} dies`;
    return p.hours > 0 ? `${dies} i ${p.hours} h` : dies;
  }
  if (p.hours > 0) return `Falten ${p.hours} h ${p.minutes} min`;
  if (p.minutes > 0) return `Falten ${p.minutes} min`;
  return "Comença ara!";
}
```

- [ ] **Step 4: Executa el test i comprova que passa**

Run: `npm test -- countdown`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/countdown.ts src/lib/__tests__/countdown.test.ts
git commit -m "feat(tardeo): lògica del compte enrere"
```

---

### Task 5: Component del compte enrere

**Files:**
- Create: `quadrant-fm/src/components/Countdown.tsx`
- Test: `quadrant-fm/src/components/__tests__/Countdown.test.tsx`

**Interfaces:**
- Consumes: `countdownParts`, `formatCountdown` de la Task 4.
- Produces: `Countdown({ target }: { target: string })`, component client.

Els tests fan servir dates reals molt llunyanes (2099) i molt passades (2020) en comptes de falsejar el rellotge: `vi.setSystemTime` obliga a activar els timers falsos i això topa amb el `waitFor` de Testing Library i amb el `setInterval` del component.

- [ ] **Step 1: Escriu el test que falla**

Crea `quadrant-fm/src/components/__tests__/Countdown.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Countdown } from "../Countdown";

describe("Countdown", () => {
  it("mostra el temps que falta si la data és futura", () => {
    render(<Countdown target="2099-01-01T00:00:00+01:00" />);
    expect(screen.getByText(/Falten \d+ dies/)).toBeInTheDocument();
  });

  it("no dibuixa res si la data ja ha passat", () => {
    const { container } = render(<Countdown target="2020-01-01T00:00:00+01:00" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("no dibuixa res si la data no és vàlida", () => {
    const { container } = render(<Countdown target="qualsevol cosa" />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Executa el test i comprova que falla**

Run: `npm test -- Countdown`
Expected: FAIL, no es pot resoldre el mòdul `../Countdown`.

- [ ] **Step 3: Implementa**

Crea `quadrant-fm/src/components/Countdown.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { countdownParts, formatCountdown } from "@/lib/countdown";

/** Compte enrere informatiu. No tanca res: quan arriba l'hora, desapareix. */
export function Countdown({ target }: { target: string }) {
  // Es calcula només un cop muntat al navegador: si el servidor pintés una
  // hora i el client una altra, React avortaria la hidratació.
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const parts = countdownParts(target, new Date());
      setText(parts ? formatCountdown(parts) : null);
    };
    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, [target]);

  if (!text) return null;

  return (
    <p className="text-[11px] font-bold text-pink-700 bg-pink-50 rounded-full px-2.5 py-1 inline-block">
      <span aria-hidden>⏳</span> {text}
    </p>
  );
}
```

- [ ] **Step 4: Executa el test i comprova que passa**

Run: `npm test -- Countdown`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Countdown.tsx src/components/__tests__/Countdown.test.tsx
git commit -m "feat(tardeo): component del compte enrere"
```

---

### Task 6: Cel·la de plaça bloquejada

**Files:**
- Modify: `quadrant-fm/src/components/SlotCell.tsx`
- Test: `quadrant-fm/src/components/__tests__/SlotCell.test.tsx`

**Interfaces:**
- Consumes: `Slot.blocked` de la Task 1.
- Produces: `SlotCell` no crida mai `onClaim` ni `onRelease` per a una plaça bloquejada; hi crida `onInfo` amb el text `Plaça N · la cobreix una altra colla`.

- [ ] **Step 1: Escriu els tests que fallen**

Afegeix dins del `describe("SlotCell", ...)` de `quadrant-fm/src/components/__tests__/SlotCell.test.tsx`:

```tsx
  it("plaça bloquejada: mostra el número i no es pot agafar", () => {
    const onClaim = vi.fn();
    const onInfo = vi.fn();
    render(
      <SlotCell slot={{ ...base, id: 339, num: 39, blocked: true }} mine={false}
        onClaim={onClaim} onRelease={vi.fn()} onInfo={onInfo} />,
    );
    expect(screen.getByText("39")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(onClaim).not.toHaveBeenCalled();
    expect(onInfo).toHaveBeenCalledWith("Plaça 39 · la cobreix una altra colla");
  });

  it("plaça bloquejada amb nom: el mostra i no la pot alliberar ningú", () => {
    const onRelease = vi.fn();
    render(
      <SlotCell slot={{ ...base, id: 339, num: 39, blocked: true, taken_by: "Jordi" }}
        mine={true} onClaim={vi.fn()} onRelease={onRelease} onInfo={vi.fn()} />,
    );
    expect(screen.getByText("Jordi")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(onRelease).not.toHaveBeenCalled();
  });
```

- [ ] **Step 2: Executa els tests i comprova que fallen**

Run: `npm test -- SlotCell`
Expected: FAIL. La cel·la bloquejada encara es comporta com una de lliure i crida `onClaim`.

- [ ] **Step 3: Implementa**

A `quadrant-fm/src/components/SlotCell.tsx`, insereix aquest bloc just després de la línia `const num = slot.num ?? slot.id;` i **abans** del `if (free)`:

```tsx
  // Places d'una altra colla: es veuen (amb el número i, si el sabem, el nom)
  // però no són nostres, així que no hi ha ni claim ni release possible.
  if (slot.blocked) {
    return (
      <button
        onClick={() => onInfo?.(`Plaça ${num} · la cobreix una altra colla`)}
        title={`Plaça ${num} · la cobreix una altra colla`}
        className="h-9 w-full rounded-md border border-black/10 px-1 leading-none overflow-hidden flex flex-col items-center justify-center text-white"
        style={{ backgroundColor: "#666666" }}
      >
        {slot.taken_by ? (
          <>
            <span className="text-[9px] opacity-70">#{num}</span>
            <span className="block w-full truncate text-[11px] font-semibold">{slot.taken_by}</span>
          </>
        ) : (
          <span className="text-sm font-bold opacity-80">{num}</span>
        )}
      </button>
    );
  }
```

- [ ] **Step 4: Executa els tests i comprova que passen**

Run: `npm test -- SlotCell`
Expected: PASS, també els cinc tests que ja hi havia.

- [ ] **Step 5: Commit**

```bash
git add src/components/SlotCell.tsx src/components/__tests__/SlotCell.test.tsx
git commit -m "feat(tardeo): cel·la de plaça bloquejada per una altra colla"
```

---

### Task 7: Configuració de l'esdeveniment, ruta i muntatge

**Files:**
- Modify: `quadrant-fm/src/lib/events.ts`
- Modify: `quadrant-fm/src/components/ShiftGrid.tsx`
- Modify: `quadrant-fm/src/hooks/useSlots.ts`
- Modify: `quadrant-fm/src/components/EventPage.tsx`
- Create: `quadrant-fm/src/app/tardeo/page.tsx`
- Modify: `quadrant-fm/src/app/page.tsx`

**Interfaces:**
- Consumes: `TARDEO_COLS` (Task 2), `Countdown` (Task 5), `SlotCell` bloquejada (Task 6).
- Produces: `TARDEO_EVENT: EventConfig`; `EventConfig` guanya `countdownTo?: string`, `showLegend?: boolean` i `article?: "aquesta" | "aquest"`; `useSlots.claim` pot retornar `"blocked"`.

- [ ] **Step 1: Amplia la configuració d'esdeveniments**

A `quadrant-fm/src/lib/events.ts`, canvia la línia d'import de columnes:

```ts
import { FM_COLS, FRIGO_COLS, GATZARA_COLS, TARDEO_COLS } from "./grid";
```

Afegeix aquests tres camps dins de `EventConfig`, després de `programPdf`:

```ts
  /** Instant ISO amb zona: mostra un compte enrere informatiu (no tanca res). */
  countdownTo?: string;
  /** Fals als esdeveniments sense nivells d'experiència. Per defecte, cert. */
  showLegend?: boolean;
  /** Demostratiu català del nom: "aquesta FM", "aquest Tardeo". */
  article?: "aquesta" | "aquest";
```

I afegeix la configuració nova al final del fitxer:

```ts
export const TARDEO_EVENT: EventConfig = {
  event: "tardeo",
  name: "Tardeo",
  article: "aquest",
  medal: { bronze: 1, plata: 2, or: 3 },
  // Sense títol: el quadrant només ensenya el dia i les franges.
  grids: [{ title: "", tables: ["TARDEO"], cols: TARDEO_COLS }],
  countdownTo: "2026-09-19T19:00:00+02:00",
  showLegend: false,
};
```

- [ ] **Step 2: Amaga el títol de la graella quan és buit**

A `quadrant-fm/src/components/ShiftGrid.tsx`, substitueix el bloc de l'`<h2>` per:

```tsx
      {/* Nivell 1 — Activitat (super-card). El Tardeo no en porta. */}
      {title && (
        <h2 className="text-2xl font-extrabold uppercase tracking-wide mb-4" style={{ color: "#fa3c92" }}>
          {title}
        </h2>
      )}
```

- [ ] **Step 3: Propaga l'estat "blocked" que retorna l'RPC**

A `quadrant-fm/src/hooks/useSlots.ts`, actualitza el comentari de sobre de `claim`:

```ts
  // Returns: "ok" | "dup" (already has one in this franja) | "taken" (lost race)
  //        | "blocked" (another colla covers it) | "error"
```

I dins de `claim`, afegeix la línia nova just abans de `if (data === "dup")`:

```ts
    if (data === "blocked") return "blocked";
    if (data === "dup") return "dup";
```

Sense això, un `"blocked"` cauria al camí per defecte i l'usuari veuria «l'acaba d'agafar algú altre», que és mentida.

- [ ] **Step 4: Declara el demostratiu abans de l'efecte de les medalles**

A `quadrant-fm/src/components/EventPage.tsx`, afegeix aquesta línia just després de `const t = config.medal;` (ha d'anar per sobre de l'`useEffect` de les medalles, que ja la fa servir):

```tsx
  const dem = config.article ?? "aquesta";
```

Dins d'aquell `useEffect`, substitueix les tres plantilles de missatge:

```tsx
      const msg =
        reachedOr ? `Ja ets OR! 🥇 Gràcies per col·laborar amb La Mama Ve fins a ${t.or} vegades durant ${dem} ${config.name}!` :
        reachedPlata ? `Ja ets PLATA! 🥈 Gràcies per col·laborar amb La Mama Ve fins a ${t.plata} vegades durant ${dem} ${config.name}!` :
        reachedBronze ? `Ja ets BRONZE! 🥉 Gràcies per col·laborar amb La Mama Ve durant ${dem} ${config.name}!` :
        `Genial! Ja portes ${myCount} torns 🎉`;
```

I afegeix `dem` a les dependències d'aquest `useEffect`:

```tsx
  }, [loading, myName, myCount, showInfo, t, config.name, dem]);
```

- [ ] **Step 5: Missatge de congelat, guard de claim i compte enrere**

Encara a `quadrant-fm/src/components/EventPage.tsx`.

Afegeix l'import amb la resta de components:

```tsx
import { Countdown } from "@/components/Countdown";
```

Substitueix la línia del `frozenMsg` perquè faci servir el demostratiu ja declarat:

```tsx
  const frozenMsg = `${dem[0].toUpperCase()}${dem.slice(1)} ${config.name} ja ha acabat: el quadrant és només de consulta 🔒`;
```

Substitueix `handleClaim` sencera per:

```tsx
  const handleClaim = (slotId: number) => {
    if (config.frozen) { showInfo(frozenMsg); return; }
    const target = slots.find((s) => s.id === slotId);
    // Places d'una altra colla: ni tan sols s'intenta cridar l'RPC.
    if (target?.blocked) { showInfo("Aquesta plaça la cobreix una altra colla"); return; }
    // Bloqueig per solapament d'hores dins del mateix dia (p. ex. cap de
    // pista 18:00-0:00 coincideix amb barra 19:00-20:30).
    if (target) {
      const clash = findOverlap(target, slots.filter((s) => isMine(s)));
      if (clash) {
        showInfo(`No pots agafar-la: ja tens la plaça ${clash.num ?? clash.id} (${clash.time}), que coincideix amb aquesta franja`);
        return;
      }
    }
    claim(slotId, name, user.id).then((status) => {
      if (status === "dup") showInfo("Ja tens una plaça en aquesta franja horària");
      else if (status === "blocked") showInfo("Aquesta plaça la cobreix una altra colla");
      else if (status === "taken") showInfo("Aquesta plaça l'acaba d'agafar algú altre");
    });
  };
```

Al header, just després del bloc `{config.frozen && (…)}`, afegeix el compte enrere:

```tsx
          {config.countdownTo && <Countdown target={config.countdownTo} />}
```

I fes opcional la llegenda; el `<span />` manté el `justify-between` que empeny el botó del programa cap a la dreta:

```tsx
            {config.showLegend === false ? <span /> : <Legend />}
```

- [ ] **Step 6: Crea la ruta**

Crea `quadrant-fm/src/app/tardeo/page.tsx`:

```tsx
import { EventPage } from "@/components/EventPage";
import { TARDEO_EVENT } from "@/lib/events";

export default function TardeoPage() {
  return <EventPage config={TARDEO_EVENT} />;
}
```

- [ ] **Step 7: Afegeix la targeta al selector**

A `quadrant-fm/src/app/page.tsx`, posa aquesta entrada la **primera** de l'array `CARDS`:

```tsx
  {
    href: "/tardeo", title: "TARDEO FINAL D'ESTIU", desc: "Dissabte 19 de setembre", emoji: "🌅",
    badge: "Obert", badgeClass: "bg-pink-100 text-pink-700",
  },
```

- [ ] **Step 8: Passa la porta de qualitat sencera**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: tot verd.

- [ ] **Step 9: Comprova-ho al navegador**

Run: `npm run dev`

Obre `http://localhost:3000` i verifica, **sense agafar cap plaça** (la BD encara no té les files; això arriba a la Task 9, així que de moment les places sortiran totes lliures a partir de la metadata):
- La targeta del Tardeo surt la primera, amb el badge rosa «Obert».
- A `/tardeo` no hi ha títol de graella; es veu l'encapçalament `Dia 19/09`, el compte enrere i cap llegenda de colors.
- Les files de 10:30 i 2:00-4:00 porten `Muntatge` i `Desmuntatge`; cap altra fila porta etiqueta.
- Les 26 places grises no fan res més que treure el toast.
- La barra diu `26 / 26 places lliures · 0% cobert`.

Atura el servidor quan acabis.

- [ ] **Step 10: Commit**

```bash
git add src/lib/events.ts src/components/ShiftGrid.tsx src/components/EventPage.tsx src/hooks/useSlots.ts src/app/tardeo/page.tsx src/app/page.tsx
git commit -m "feat(tardeo): ruta /tardeo, compte enrere i targeta al selector"
```

---

### Task 8: Admin — escriure els noms de l'altra colla

**Files:**
- Create: `quadrant-fm/src/app/api/admin/assign/route.ts`
- Modify: `quadrant-fm/src/app/admin/page.tsx`

**Interfaces:**
- Consumes: la columna `blocked` de la BD (Task 9); `ADMIN_KEY`, `NEXT_PUBLIC_SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY` de l'entorn.
- Produces: `POST /api/admin/assign` amb cos `{ key, id, name }` → `{ ok: true }` o `{ ok: false, error }`.

- [ ] **Step 1: Crea l'endpoint**

Crea `quadrant-fm/src/app/api/admin/assign/route.ts`:

```ts
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
```

- [ ] **Step 2: Afegeix el formulari a l'admin**

A `quadrant-fm/src/app/admin/page.tsx`, afegeix l'estat nou just després de `const [id, setId] = useState("");`:

```tsx
  const [blockedId, setBlockedId] = useState("");
  const [blockedName, setBlockedName] = useState("");
```

Afegeix aquesta funció just després de `clearAll`:

```tsx
  async function assignBlocked() {
    const r = await callAdmin("/api/admin/assign", {
      id: Number(blockedId),
      name: blockedName,
    });
    if (!r.ok) { setMsg(r.error); return; }
    setMsg(
      blockedName.trim()
        ? `Plaça ${blockedId} assignada a ${blockedName.trim()}`
        : `Plaça ${blockedId} buidada`,
    );
    setBlockedName("");
  }
```

I afegeix aquesta targeta a la interfície, entre la targeta de la clau d'admin i la de l'historial. L'input demana l'**id intern** (301-352), no el número visible:

```tsx
        <div className="bg-white rounded-xl shadow p-5 space-y-3">
          <h2 className="font-bold">Places d&apos;una altra colla</h2>
          <p className="text-xs text-gray-500">
            Escriu el nom que et passin. Deixa el nom en blanc per buidar la plaça.
            Només funciona amb places bloquejades. Al Tardeo, l&apos;id és 300 + el
            número que es veu (la plaça 39 és l&apos;id 339).
          </p>
          <div className="flex gap-2">
            <input value={blockedId} onChange={(e) => setBlockedId(e.target.value)}
              placeholder="Id (301-352)" className="w-32 border rounded px-3 py-2" />
            <input value={blockedName} onChange={(e) => setBlockedName(e.target.value)}
              placeholder="Nom" className="flex-1 border rounded px-3 py-2" />
            <button onClick={assignBlocked} className="bg-pink-600 text-white rounded px-4">
              Desar
            </button>
          </div>
        </div>
```

- [ ] **Step 3: Comprova que compila**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: tot verd.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/assign/route.ts src/app/admin/page.tsx
git commit -m "feat(admin): assignar noms a les places d'una altra colla"
```

---

### Task 9: Migració de BD i seed

Aquesta tasca **escriu a producció**. Els fitxers es poden escriure i commitar sense problema; executar res contra Supabase requereix l'OK explícit de Marc en aquell moment.

**Files:**
- Create: `quadrant-fm/supabase/tardeo.sql`
- Create: `quadrant-fm/scripts/seed-tardeo.mjs`

**Interfaces:**
- Consumes: `slots.json` amb les entrades del Tardeo (Task 1).
- Produces: columna `public.slots.blocked`; `claim_slot` retorna `'blocked'`; 52 files noves a `public.slots`.

- [ ] **Step 1: Escriu la migració**

Crea `quadrant-fm/supabase/tardeo.sql`:

```sql
-- TARDEO FINAL D'ESTIU — places que cobreix una altra colla.
-- Executar UN cop al SQL Editor de Supabase. Idempotent.
-- No toca cap fila existent: FM i Gatzara queden amb blocked = false.

alter table public.slots
  add column if not exists blocked boolean not null default false;

-- claim_slot rebutja les places bloquejades abans de tocar res. Sense aquesta
-- comprovació la protecció seria només del navegador, i n'hi hauria prou amb
-- la consola per saltar-se-la.
create or replace function public.claim_slot(p_id int, p_person text, p_external_id text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_block   text;
  v_time    text;
  v_blocked boolean;
  v_key     text;
  updated   int;
begin
  if p_person is null or length(trim(p_person)) = 0 then
    return 'error';
  end if;

  select block, time_label, blocked
    into v_block, v_time, v_blocked
    from public.slots where id = p_id;
  if v_block is null then
    return 'error';
  end if;
  if v_blocked then
    return 'blocked';
  end if;
  v_key := v_block || '|' || v_time;

  -- Same person (by ID) already has a slot in this franja?
  if p_external_id is not null and exists (
       select 1 from public.slot_owner
       where person_id = p_external_id and franja_key = v_key
     ) then
    return 'dup';
  end if;

  update public.slots
     set taken_by = trim(p_person), taken_at = now()
   where id = p_id and taken_by is null;
  get diagnostics updated = row_count;
  if updated <> 1 then
    return 'taken';
  end if;

  insert into public.slot_owner (slot_id, person_id, franja_key)
    values (p_id, coalesce(p_external_id, ''), v_key)
    on conflict (slot_id) do update
      set person_id = excluded.person_id, franja_key = excluded.franja_key;

  insert into public.slot_events (slot_id, person, person_id, action)
    values (p_id, trim(p_person), p_external_id, 'claim');

  return 'ok';
end;
$$;

grant execute on function public.claim_slot(int, text, text) to anon, authenticated;
```

- [ ] **Step 2: Escriu el seed**

Crea `quadrant-fm/scripts/seed-tardeo.mjs`:

```js
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
```

- [ ] **Step 3: Commit dels fitxers, encara sense executar res**

```bash
git add supabase/tardeo.sql scripts/seed-tardeo.mjs
git commit -m "chore(tardeo): migració de BD i seed idempotent"
```

- [ ] **Step 4: Demana l'OK a Marc i executa**

Ensenya-li `supabase/tardeo.sql` i espera l'OK explícit. Quan el tinguis:
1. Marc executa `supabase/tardeo.sql` al SQL Editor de Supabase.
2. Run: `node scripts/seed-tardeo.mjs`
   Expected: `Tardeo a BD: 52 (esperat 52) · bloquejades: 26 (esperat 26)`, el recompte d'«altres esdeveniments» igual abans i després, i `OK`.

Si `beforeOthers` i `afterOthers` no coincideixen, alguna cosa ha tocat FM o Gatzara: atura't i restaura des del backup JSON que ha deixat l'script.

- [ ] **Step 5: Verificació final**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: tot verd.

Run: `npm run dev` i comprova a `/tardeo`, entrant amb un soci de proves:
- Agafar una plaça rosa funciona i la barra passa a `25 / 26`.
- Clicar una plaça grisa només mostra el toast, i a la BD segueix amb `taken_by` nul.
- Alliberar la plaça la torna a deixar lliure i la barra torna a `26 / 26`.

Deixa el quadrant net (cap inscripció de prova) abans d'acabar.

- [ ] **Step 6: Demana l'OK per al push**

El push desplega a producció. No el facis sense que Marc ho digui explícitament.

```bash
git log --oneline origin/main..HEAD   # ensenya-li què s'enviaria
```
