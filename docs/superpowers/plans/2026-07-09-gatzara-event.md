# Gatzara Event Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Afegir l'esdeveniment Gatzara (51 places, 16-17/07/2026) amb selector d'entrada, pàgines `/fm` i `/gatzara`, i % + medalles per esdeveniment, sense tocar cap dada FM.

**Architecture:** Mateixa app Next.js i mateixa taula Supabase `slots`. Els slots Gatzara ocupen ids **201-251** (`id = 200 + num`, on `num` 1-51 és el número visible). La separació d'esdeveniments viu al metadata del bundle (`slots.json`, camp `event`); la BD només rep un INSERT idempotent de 51 files noves.

**Tech Stack:** Next.js (app router) + TypeScript + Tailwind + Supabase JS + Vitest/@testing-library.

## Global Constraints

- **MAI modificar les entrades FM**: ids 1-149 de `quadrant-fm/slots.json` i files 1-149 de la BD queden intactes byte a byte.
- Ids Gatzara: `id = 200 + num` (num = 1-51, el número del full Excel).
- Colors segons spec re-verificada 2026-07-09 (18, 26 i 47 són **verd**).
- Directori de treball per a totes les comandes: `c:/Quadrant-motors-LMV/quadrant-fm` (Git Bash).
- Spec: `docs/superpowers/specs/2026-07-09-gatzara-event-design.md`.
- Commits amb missatge en català, prefix `feat:`/`test:`/`chore:`.

---

### Task 1: Types + metadata Gatzara a slots.json + helpers per esdeveniment

**Files:**
- Modify: `quadrant-fm/src/lib/types.ts`
- Create: `quadrant-fm/scripts/gen-gatzara.mjs` (generador, s'executa un cop)
- Modify: `quadrant-fm/slots.json` (només APPEND de 51 entrades)
- Modify: `quadrant-fm/src/lib/slots-data.ts`
- Test: `quadrant-fm/src/lib/__tests__/slots-data.test.ts`

**Interfaces:**
- Produces: `EventId = "fm" | "gatzara"`; `SlotMeta` amb `event?: EventId`, `num?: number`, `tag: string | null`; `TableName` amb `"GATZARA_BARRA" | "GATZARA_CUINA"`; `slotsForEvent(event: EventId): SlotMeta[]`; `MedalThresholds { bronze: number; plata: number; or: number }`.

- [ ] **Step 1: Actualitzar types.ts**

A `quadrant-fm/src/lib/types.ts`, substituir les primeres línies i afegir tipus:

```ts
export type SlotColor = "roig" | "vermell" | "verd" | "blanc";
export type TableName = "FM" | "FRIGO" | "GATZARA_BARRA" | "GATZARA_CUINA";
export type EventId = "fm" | "gatzara";

export interface MedalThresholds {
  bronze: number;
  plata: number;
  or: number;
}

/** Static metadata seeded once. */
export interface SlotMeta {
  id: number;
  table: TableName;
  block: string;
  time: string;
  /** Row label: Muntatge/Desmuntatge o rol de cuina (PATATERO, CUINA...). */
  tag: string | null;
  color: SlotColor;
  col: string;
  /** Esdeveniment; absent = "fm" (entrades FM originals, no es toquen). */
  event?: EventId;
  /** Número visible a la UI; absent = id (FM mostra id, Gatzara 1-51). */
  num?: number;
}
```

I a `GridRow`, canviar `tag: "Muntatge" | "Desmuntatge" | null;` per `tag: string | null;`.

- [ ] **Step 2: Escriure el generador d'entrades Gatzara**

Create `quadrant-fm/scripts/gen-gatzara.mjs`:

```js
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
// [num, time, tag(rol), col, color] — ordre = ordre de visualització
const cuina = [
  [46, "18:00-20:00", "MUNTAR/SERVIR", "Q", "verd"],
  [47, "18:00-20:00", "MUNTAR/SERVIR", "R", "verd"],
  [45, "18:00-22:00", "CAP CUINA", "P", "roig"],
  [51, "18:00-0:00", "CAP PISTA", "S", "vermell"],
  [43, "20:00-22:00", "PATATERO", "N", "verd"],
  [44, "20:00-22:00", "CUINA", "O", "vermell"],
  [48, "20:00-22:00", "MUNTAR/SERVIR", "Q", "vermell"],
  [49, "20:00-22:00", "MUNTAR/SERVIR", "R", "vermell"],
  [50, "22:00-0:00", "PATATERO", "N", "verd"],
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
```

- [ ] **Step 3: Executar el generador i verificar a mà**

Run: `node scripts/gen-gatzara.mjs`
Expected: `Afegides 51 entrades. Total: 200`

Run: `git diff --stat slots.json` — només línies afegides al final; cap entrada FM canviada.

- [ ] **Step 4: Helpers a slots-data.ts**

Substituir `quadrant-fm/src/lib/slots-data.ts` per:

```ts
import raw from "../../slots.json";
import type { EventId, SlotMeta } from "./types";

// slots.json carries an extra `oldNum` field (provenance) we drop here.
export const SLOTS_META: SlotMeta[] = (raw as Array<SlotMeta & { oldNum?: number }>).map(
  ({ oldNum: _oldNum, ...meta }) => meta,
);

/** Metadata d'un esdeveniment; les entrades sense `event` són FM. */
export function slotsForEvent(event: EventId): SlotMeta[] {
  return SLOTS_META.filter((m) => (m.event ?? "fm") === event);
}
```

- [ ] **Step 5: Test de la metadata**

Create `quadrant-fm/src/lib/__tests__/slots-data.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { SLOTS_META, slotsForEvent } from "../slots-data";

describe("slots-data (Gatzara)", () => {
  const g = slotsForEvent("gatzara");
  const byNum = new Map(g.map((s) => [s.num, s]));

  it("FM queda intacte: 149 entrades sense camp event", () => {
    const fm = slotsForEvent("fm");
    expect(fm).toHaveLength(149);
    expect(fm.every((s) => s.event === undefined)).toBe(true);
    expect(SLOTS_META).toHaveLength(200);
  });

  it("Gatzara: 51 places, ids 201-251 = 200 + num", () => {
    expect(g).toHaveLength(51);
    expect(g.every((s) => s.id === 200 + (s.num ?? 0))).toBe(true);
    expect(new Set(g.map((s) => s.id)).size).toBe(51);
  });

  it("colors re-verificats: 18, 26 i 47 verds; 45 roig; 51 vermell", () => {
    expect(byNum.get(18)?.color).toBe("verd");
    expect(byNum.get(26)?.color).toBe("verd");
    expect(byNum.get(47)?.color).toBe("verd");
    expect(byNum.get(45)?.color).toBe("roig");
    expect(byNum.get(51)?.color).toBe("vermell");
  });

  it("fusions del full: 45 = 18:00-22:00, 51 = 18:00-0:00, amb rol com a tag", () => {
    expect(byNum.get(45)).toMatchObject({ time: "18:00-22:00", tag: "CAP CUINA", table: "GATZARA_CUINA" });
    expect(byNum.get(51)).toMatchObject({ time: "18:00-0:00", tag: "CAP PISTA" });
  });

  it("muntatges: dijous 19:00 (1-6) i divendres 11:00 (7-12), blancs", () => {
    expect(byNum.get(1)).toMatchObject({ block: "Gatzara dijous 16/07", time: "19:00", tag: "Muntatge", color: "blanc" });
    expect(byNum.get(7)).toMatchObject({ block: "Gatzara divendres 17/07", time: "11:00", tag: "Muntatge", color: "blanc" });
  });
});
```

- [ ] **Step 6: Executar tests**

Run: `npm test`
Expected: PASS (els nous i els existents: grid.test.ts, SlotCell.test.tsx).

- [ ] **Step 7: Commit**

```bash
git add src/lib/types.ts src/lib/slots-data.ts src/lib/__tests__/slots-data.test.ts scripts/gen-gatzara.mjs slots.json
git commit -m "feat(gatzara): metadata dels 51 slots (ids 201-251) + tipus event/num"
```

---

### Task 2: Files per (bloc, hora, tag) a grid.ts + columnes Gatzara

**Files:**
- Modify: `quadrant-fm/src/lib/grid.ts`
- Test: `quadrant-fm/src/lib/__tests__/grid.test.ts` (afegir casos)

**Interfaces:**
- Consumes: `SlotMeta.tag: string | null` (Task 1)
- Produces: `GATZARA_COLS = ["N","O","P","Q","R","S"]`; `buildGrid` separa files amb la mateixa hora però tag diferent.

- [ ] **Step 1: Test que falla**

Afegir a `grid.test.ts` (dins `describe("buildGrid", ...)`):

```ts
it("separa files amb la mateixa hora però tag (rol) diferent", () => {
  const slots: Slot[] = [
    slot({ id: 243, block: "G", time: "20:00-22:00", tag: "PATATERO", col: "N" }),
    slot({ id: 244, block: "G", time: "20:00-22:00", tag: "CUINA", col: "O" }),
    slot({ id: 248, block: "G", time: "20:00-22:00", tag: "MUNTAR/SERVIR", col: "Q" }),
    slot({ id: 249, block: "G", time: "20:00-22:00", tag: "MUNTAR/SERVIR", col: "R" }),
  ];
  const grid = buildGrid(slots, GATZARA_COLS);
  expect(grid[0].rows).toHaveLength(3);
  expect(grid[0].rows.map((r) => r.tag)).toEqual(["PATATERO", "CUINA", "MUNTAR/SERVIR"]);
  expect(grid[0].rows[2].cells.filter(Boolean).map((c) => c!.id)).toEqual([248, 249]);
});
```

I a l'import del test: `import { buildGrid, computeStats, FM_COLS, FRIGO_COLS, GATZARA_COLS } from "../grid";`

- [ ] **Step 2: Verificar que falla**

Run: `npm test -- grid`
Expected: FAIL (`GATZARA_COLS` no existeix; una sola fila en lloc de 3).

- [ ] **Step 3: Implementar**

A `grid.ts`: afegir `export const GATZARA_COLS = ["N", "O", "P", "Q", "R", "S"];` i canviar la clau de fila:

```ts
const rowKey = `${s.block} ${s.time} ${s.tag ?? ""}`;
```

(A FM no canvia res: cada combinació bloc+hora té un únic tag.)

- [ ] **Step 4: Tests en verd**

Run: `npm test`
Expected: PASS (tots).

- [ ] **Step 5: Commit**

```bash
git add src/lib/grid.ts src/lib/__tests__/grid.test.ts
git commit -m "feat(gatzara): files per (bloc, hora, rol) i columnes Gatzara al grid"
```

---

### Task 3: SlotCell mostra el número visible (num ?? id)

**Files:**
- Modify: `quadrant-fm/src/components/SlotCell.tsx`
- Test: `quadrant-fm/src/components/__tests__/SlotCell.test.tsx` (afegir cas)

**Interfaces:**
- Consumes: `SlotMeta.num` (Task 1)
- Produces: chips que mostren `slot.num ?? slot.id`; `onClaim`/`onRelease` segueixen rebent `slot.id`.

- [ ] **Step 1: Test que falla**

Afegir a `SlotCell.test.tsx`:

```ts
it("mostra num (número visible) si existeix, però opera amb id", () => {
  const onClaim = vi.fn();
  render(<SlotCell slot={{ ...base, id: 213, num: 13 }} mine={false} onClaim={onClaim} onRelease={vi.fn()} />);
  expect(screen.getByText("13")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button"));
  expect(onClaim).toHaveBeenCalledWith(213);
});
```

- [ ] **Step 2: Verificar que falla**

Run: `npm test -- SlotCell`
Expected: FAIL (mostra "213" en lloc de "13").

- [ ] **Step 3: Implementar**

A `SlotCell.tsx`, a dalt de la funció: `const num = slot.num ?? slot.id;` i substituir totes les aparicions visibles: al botó lliure `{num}` i `title={\`Plaça ${num} lliure\`}`; a l'ocupat `#{num}` i als `title`/`onInfo` (`Plaça ${num} · ...`).

- [ ] **Step 4: Tests en verd**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/SlotCell.tsx src/components/__tests__/SlotCell.test.tsx
git commit -m "feat(gatzara): SlotCell mostra el número visible (num) mantenint l'id intern"
```

---

### Task 4: useSlots filtra per esdeveniment

**Files:**
- Modify: `quadrant-fm/src/hooks/useSlots.ts`

**Interfaces:**
- Consumes: `slotsForEvent` (Task 1)
- Produces: `useSlots(externalId: string | null, event: EventId)` — mateix retorn; `slots` només conté l'esdeveniment. `mineIds` continua sent global (es filtra a EventPage).

- [ ] **Step 1: Implementar**

A `useSlots.ts`:

```ts
import { slotsForEvent } from "@/lib/slots-data";
import type { EventId, Slot, SlotState } from "@/lib/types";

function merge(state: Record<number, TakenInfo>, event: EventId): Slot[] {
  return slotsForEvent(event).map((m) => ({
    ...m,
    taken_by: state[m.id]?.by ?? null,
    taken_at: state[m.id]?.at ?? null,
  }));
}

export function useSlots(externalId: string | null, event: EventId) {
```

i al retorn: `return { slots: merge(taken, event), loading, error, claim, release, mineIds, mineReady };`

(La càrrega i el realtime segueixen duent tots els ids; els d'altres esdeveniments queden ignorats pel merge. El realtime de la taula `slots` ja inclou les files noves.)

- [ ] **Step 2: Typecheck (la resta del build es verifica a Task 5)**

Run: `npx tsc --noEmit`
Expected: errors NOMÉS a `src/app/page.tsx` (encara crida `useSlots(user?.id ?? null)` amb 1 argument) — es resol a Task 5. Cap altre error.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useSlots.ts
git commit -m "feat(gatzara): useSlots parametritzat per esdeveniment"
```

---

### Task 5: MedalBadge amb llindars, EventPage compartit, rutes /, /fm, /gatzara

**Files:**
- Modify: `quadrant-fm/src/components/MedalBadge.tsx`
- Create: `quadrant-fm/src/lib/events.ts`
- Create: `quadrant-fm/src/components/EventPage.tsx` (el cos actual de page.tsx, parametritzat)
- Create: `quadrant-fm/src/app/fm/page.tsx`
- Create: `quadrant-fm/src/app/gatzara/page.tsx`
- Modify: `quadrant-fm/src/app/page.tsx` (passa a ser el selector)
- Test: `quadrant-fm/src/lib/__tests__/medal.test.ts`

**Interfaces:**
- Consumes: `useSlots(id, event)` (Task 4), `GATZARA_COLS` (Task 2), `MedalThresholds` (Task 1)
- Produces: `tierFor(count, thresholds)`; `EventConfig { event, name, medal, grids, programPdf? }`; `FM_EVENT`, `GATZARA_EVENT`.

- [ ] **Step 1: Test de llindars que falla**

Create `quadrant-fm/src/lib/__tests__/medal.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { tierFor } from "@/components/MedalBadge";
import { FM_EVENT, GATZARA_EVENT } from "@/lib/events";

describe("medalles per esdeveniment", () => {
  it("FM: 1/3/5 (com fins ara)", () => {
    expect(tierFor(0, FM_EVENT.medal)).toBeNull();
    expect(tierFor(1, FM_EVENT.medal)?.label).toBe("Bronze");
    expect(tierFor(3, FM_EVENT.medal)?.label).toBe("Plata");
    expect(tierFor(5, FM_EVENT.medal)?.label).toBe("Or");
  });
  it("Gatzara: 1 bronze, 2 plata, 3 or", () => {
    expect(tierFor(1, GATZARA_EVENT.medal)?.label).toBe("Bronze");
    expect(tierFor(2, GATZARA_EVENT.medal)?.label).toBe("Plata");
    expect(tierFor(3, GATZARA_EVENT.medal)?.label).toBe("Or");
  });
  it("tierFor sense llindars manté 1/3/5", () => {
    expect(tierFor(4)?.label).toBe("Plata");
  });
});
```

- [ ] **Step 2: Verificar que falla**

Run: `npm test -- medal`
Expected: FAIL (`events.ts` no existeix; `tierFor` no accepta llindars).

- [ ] **Step 3: MedalBadge amb llindars**

A `MedalBadge.tsx`:

```tsx
import type { MedalThresholds } from "@/lib/types";

export const DEFAULT_THRESHOLDS: MedalThresholds = { bronze: 1, plata: 3, or: 5 };

export function tierFor(count: number, t: MedalThresholds = DEFAULT_THRESHOLDS): Tier | null {
  if (count >= t.or) return GOLD;
  if (count >= t.plata) return SILVER;
  if (count >= t.bronze) return BRONZE;
  return null;
}

export function MedalBadge({ count, celebrating, thresholds = DEFAULT_THRESHOLDS }:
  { count: number; celebrating: boolean; thresholds?: MedalThresholds }) {
  const tier = tierFor(count, thresholds);
  ...
```

(La resta del component, igual.)

- [ ] **Step 4: Config d'esdeveniments**

Create `quadrant-fm/src/lib/events.ts`:

```ts
import { FM_COLS, FRIGO_COLS, GATZARA_COLS } from "./grid";
import type { EventId, MedalThresholds, TableName } from "./types";

export interface EventGrid {
  title: string;
  table: TableName;
  cols: string[];
}

export interface EventConfig {
  event: EventId;
  /** Nom visible ("aquesta FM" als missatges de celebració). */
  name: string;
  medal: MedalThresholds;
  grids: EventGrid[];
  programPdf?: string;
}

export const FM_EVENT: EventConfig = {
  event: "fm",
  name: "FM",
  medal: { bronze: 1, plata: 3, or: 5 },
  grids: [
    { title: "Prèvia i Festa Major", table: "FM", cols: FM_COLS },
    { title: "Frigofiesta", table: "FRIGO", cols: FRIGO_COLS },
  ],
  programPdf: "/Programa_Festa_Major_2026.pdf",
};

export const GATZARA_EVENT: EventConfig = {
  event: "gatzara",
  name: "Gatzara",
  medal: { bronze: 1, plata: 2, or: 3 },
  grids: [
    { title: "Barra", table: "GATZARA_BARRA", cols: GATZARA_COLS },
    { title: "Cuina i pista", table: "GATZARA_CUINA", cols: GATZARA_COLS },
  ],
};
```

- [ ] **Step 5: Tests de medalles en verd**

Run: `npm test -- medal`
Expected: PASS.

- [ ] **Step 6: EventPage (moure-hi el cos de page.tsx, parametritzat)**

Create `quadrant-fm/src/components/EventPage.tsx` — és l'actual `page.tsx` amb aquests canvis exactes (la resta, idèntica):

```tsx
"use client";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSlots } from "@/hooks/useSlots";
import { computeStats } from "@/lib/grid";
import type { EventConfig } from "@/lib/events";
import type { Slot } from "@/lib/types";
import { NameGate, type User } from "@/components/NameGate";
import { Legend } from "@/components/Legend";
import { StatsBar } from "@/components/StatsBar";
import { ShiftGrid } from "@/components/ShiftGrid";
import { MedalBadge } from "@/components/MedalBadge";
import { Confetti } from "@/components/Confetti";

const USER_KEY = "quadrant-fm-user";

export function EventPage({ config }: { config: EventConfig }) {
  // ... estat idèntic a l'actual Home ...
  const { slots, loading, error, claim, release, mineIds, mineReady } =
    useSlots(user?.id ?? null, config.event);

  // ids d'aquest esdeveniment, per comptar medalles NOMÉS d'aquí
  const eventIds = useMemo(() => new Set(slots.map((s) => s.id)), [slots]);
  const myCount = mineReady
    ? [...mineIds].filter((id) => eventIds.has(id)).length
    : (myName ? slots.filter((s) => s.taken_by === myName).length : 0);

  // celebració: llindars del config
  const t = config.medal;
  const reachedOr = prev < t.or && myCount >= t.or;
  const reachedPlata = prev < t.plata && myCount >= t.plata;
  const reachedBronze = prev < t.bronze && myCount >= t.bronze;
  const msg =
    reachedOr ? `Ja ets OR! 🥇 Gràcies per col·laborar amb La Mama Ve fins a ${t.or} vegades durant aquesta ${config.name}!` :
    reachedPlata ? `Ja ets PLATA! 🥈 Gràcies per col·laborar amb La Mama Ve fins a ${t.plata} vegades durant aquesta ${config.name}!` :
    reachedBronze ? `Ja ets BRONZE! 🥉 Gràcies per col·laborar amb La Mama Ve durant aquesta ${config.name}!` :
    `Genial! Ja portes ${myCount} torns 🎉`;

  // header: enllaç de tornada + medalla amb llindars
  //   <Link href="/" className="text-xs text-gray-400 underline shrink-0">← esdeveniments</Link>
  //   <MedalBadge count={myCount} celebrating={celebrating} thresholds={t} />
  //   El botó "📄 Programa" només si config.programPdf existeix.

  // cos: en lloc dels dos ShiftGrid fixos:
  //   {config.grids.map((g) => (
  //     <ShiftGrid key={g.table} title={g.title} slots={slots.filter((s) => s.table === g.table)}
  //       cols={g.cols} isMine={isMine} onClaim={handleClaim}
  //       onRelease={(id) => release(id, name, user.id)} onInfo={showInfo} />
  //   ))}
  // stats: const stats = computeStats(slots);  // slots ja són només d'aquest esdeveniment
}
```

Copiar l'actual `page.tsx` sencer com a base i aplicar-hi exactament aquests punts (useSlots amb event, eventIds/myCount, llindars als missatges i a MedalBadge, grids del config, enllaç ← esdeveniments, Programa condicional). Res més no canvia (NameGate, confetti, toast, header).

- [ ] **Step 7: Rutes**

Create `quadrant-fm/src/app/fm/page.tsx`:

```tsx
import { EventPage } from "@/components/EventPage";
import { FM_EVENT } from "@/lib/events";

export default function FmPage() {
  return <EventPage config={FM_EVENT} />;
}
```

Create `quadrant-fm/src/app/gatzara/page.tsx`:

```tsx
import { EventPage } from "@/components/EventPage";
import { GATZARA_EVENT } from "@/lib/events";

export default function GatzaraPage() {
  return <EventPage config={GATZARA_EVENT} />;
}
```

Substituir `quadrant-fm/src/app/page.tsx` pel selector:

```tsx
import Link from "next/link";

const CARDS = [
  { href: "/fm", title: "FM", desc: "Prèvia · Festa Major · Frigofiesta", emoji: "🎉" },
  { href: "/gatzara", title: "Gatzara", desc: "16 i 17 de juliol", emoji: "🎪" },
];

export default function Selector() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-pink-600 p-6">
      <div className="w-full max-w-sm text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/lamamave.png" alt="La Mama Ve" className="mx-auto mb-6 w-48" />
        <h1 className="text-white text-xl font-bold mb-6">On vols col·laborar?</h1>
        <div className="space-y-4">
          {CARDS.map((c) => (
            <Link key={c.href} href={c.href}
              className="block bg-white rounded-2xl shadow-xl p-6 text-left hover:scale-[1.02] transition">
              <span className="text-3xl" aria-hidden>{c.emoji}</span>
              <span className="block text-2xl font-extrabold mt-1" style={{ color: "#fa3c92" }}>{c.title}</span>
              <span className="block text-sm text-gray-500 mt-0.5">{c.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 8: Tests + build**

Run: `npm test`
Expected: PASS (tots).

Run: `npm run build`
Expected: build OK amb rutes `/`, `/fm`, `/gatzara`, `/admin`.

- [ ] **Step 9: Commit**

```bash
git add src/components/MedalBadge.tsx src/components/EventPage.tsx src/lib/events.ts src/app/page.tsx src/app/fm src/app/gatzara src/lib/__tests__/medal.test.ts
git commit -m "feat(gatzara): selector d'esdeveniments, pàgines /fm i /gatzara, medalles i % per esdeveniment"
```

---

### Task 6: Seed de la BD (INSERT idempotent) + SQL de referència

**Files:**
- Create: `quadrant-fm/scripts/seed-gatzara.mjs`
- Create: `quadrant-fm/supabase/gatzara.sql` (referència manual, mateix contingut)

**Interfaces:**
- Consumes: entrades `event: "gatzara"` de `slots.json` (Task 1)
- Produces: files 201-251 a `public.slots`; FM (1-149) intacte.

- [ ] **Step 1: Script de seed**

Create `quadrant-fm/scripts/seed-gatzara.mjs`:

```js
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
```

- [ ] **Step 2: Executar el seed**

Run: `node scripts/seed-gatzara.mjs`
Expected: `Gatzara a BD: 51 (esperat 51)`, `FM abans: 149 | FM després: 149`, `OK`.

- [ ] **Step 3: SQL de referència**

Create `quadrant-fm/supabase/gatzara.sql` amb el mateix contingut en SQL pla (per si mai cal re-seedejar des de l'SQL Editor). Generar-lo des de slots.json:

```bash
node -e "
const s=JSON.parse(require('fs').readFileSync('slots.json','utf8')).filter(x=>x.event==='gatzara');
const esc=v=>v===null?'null':\"'\"+String(v).replace(/'/g,\"''\")+\"'\";
const lines=s.map(x=>\`(\${x.id}, \${esc(x.table)}, \${esc(x.block)}, \${esc(x.time)}, \${esc(x.tag)}, \${esc(x.color)}, \${esc(x.col)})\`);
const sql='-- Slots Gatzara (201-251). Idempotent; NO toca FM (1-149).\n'+
'insert into public.slots (id, table_name, block, time_label, tag, color, col_pos) values\n'+
lines.join(',\n')+'\non conflict (id) do nothing;\n';
require('fs').writeFileSync('supabase/gatzara.sql', sql);
console.log('escrit', lines.length, 'files');
" 
```

Expected: `escrit 51 files`.

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-gatzara.mjs supabase/gatzara.sql
git commit -m "chore(gatzara): seed idempotent dels slots 201-251 a Supabase"
```

---

### Task 7: Verificació end-to-end i desplegament

**Files:** cap de nou.

- [ ] **Step 1: Suite completa + build**

Run: `npm test && npm run build`
Expected: tot PASS, build OK.

- [ ] **Step 2: Verificació manual en local**

Run: `npm run dev` i obrir `http://localhost:3000`:
- `/` mostra el selector amb 2 targetes.
- `/fm`: login DNI → graella idèntica a producció (dades reals intactes, % FM).
- `/gatzara`: 51 places numerades 1-51, colors del full (18/26/47 verds, 16-22-28-34-40-45 roigs, 51 vermell), rols com a etiqueta de fila a «Cuina i pista», % a 0 (o el que hi hagi), apuntar-se i alliberar funciona, medalla surt amb 1=Bronze, 2=Plata, 3=Or.
- Tornar a `/fm` i comprovar que el comptador de medalla NO inclou els torns de Gatzara.

- [ ] **Step 3: Push (desplegament Vercel automàtic)**

```bash
git push origin main
```

Expected: Vercel desplega; verificar en producció el selector i `/gatzara`.
