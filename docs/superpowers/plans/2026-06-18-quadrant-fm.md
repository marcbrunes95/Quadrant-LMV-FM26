# Quadrant FM 2026 (La Mama Ve) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a very visual web app that replicates the festa-major shift grid from `quadrant-fm-26.xlsx` where ~50 people sign up, in real time, to free numbered slots; occupied slots lock instantly for everyone, with a colour legend and live statistics.

**Architecture:** Next.js (App Router) front end + Supabase (Postgres + Realtime) back end. Static slot metadata is seeded once into a `slots` table; only `taken_by`/`taken_at` mutate. Claiming/releasing go through atomic Postgres RPC functions (race-safe); admin actions go through Next.js API routes using the service-role key. All browsers subscribe to Supabase Realtime so changes appear in <1s. Deployed to Vercel from GitHub.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS, `@supabase/supabase-js`, Supabase (Postgres + Realtime), Vitest + @testing-library/react for tests. Branding: La Mama Ve (pink + white), logo `lamamave.png`.

---

## Source data

The renumbered slot map already exists at the repo root as `slots.json` (149 objects). Each object:

```json
{ "id": 1, "table": "FM", "block": "Prèvia dissabte 27/06", "time": "16:00", "tag": "Muntatge", "color": "blanc", "col": "C", "oldNum": 1 }
```

- `table`: `"FM"` | `"FRIGO"`
- `block`: group label (FM block name, or `"Frigofiesta DD/MM"`)
- `time`: shift time label
- `tag`: `"Muntatge"` | `"Desmuntatge"` | `null`
- `color`: `"roig"` | `"vermell"` | `"verd"` | `"blanc"`
- `col`: original spreadsheet column letter (C–M for FM, C–F for FRIGO) — used for grid layout
- `oldNum`: original Excel number (provenance only; not displayed)

Counts: FM = 117 (ids 1–117), FRIGO = 32 (ids 118–149). Total 149.

Colour hex (legend): roig `#E06666`, vermell `#F4CCCC`, verd `#D9EAD3`, blanc `#FFFFFF`.
Corporate pink: `#EC2C8E`.

## File structure

```
quadrant-fm/                     (Next.js app root — created by create-next-app)
  slots.json                     (copied from repo root: canonical slot data)
  public/lamamave.png            (logo, copied from repo root)
  scripts/gen-seed.mjs           (slots.json -> supabase/seed.sql)
  supabase/
    schema.sql                   (table + RPC functions + grants)
    seed.sql                     (generated INSERTs)
  src/
    lib/
      types.ts                   (Slot, Grid, Stats types)
      slots-data.ts              (imports slots.json, typed export)
      grid.ts                    (buildGrid, computeStats — pure)
      supabaseClient.ts          (browser client)
      colors.ts                  (colour -> hex + label maps)
    hooks/
      useSlots.ts                (load + realtime + claim/release)
    components/
      NameGate.tsx
      Legend.tsx
      StatsBar.tsx
      SlotCell.tsx
      ShiftGrid.tsx              (renders one table: FM or FRIGO)
    app/
      layout.tsx
      page.tsx                   (name gate -> main view)
      globals.css
      admin/page.tsx
      api/admin/release/route.ts
      api/admin/clear/route.ts
  src/lib/__tests__/grid.test.ts
  src/components/__tests__/SlotCell.test.tsx
  .env.local                     (not committed)
  .env.example                   (committed)
```

---

## Task 0: Scaffold project, git, Tailwind

**Files:**
- Create: `quadrant-fm/` (whole Next.js app)
- Create: `quadrant-fm/.gitignore` (from create-next-app)
- Create: `quadrant-fm/.env.example`

- [ ] **Step 1: Create the Next.js app**

Run from repo root `c:/Quadrant-motors-LMV`:

```bash
npx create-next-app@latest quadrant-fm --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack --use-npm
```

Accept defaults for any remaining prompts.

- [ ] **Step 2: Install runtime + test deps**

```bash
cd quadrant-fm
npm install @supabase/supabase-js
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

- [ ] **Step 3: Add Vitest config**

Create `quadrant-fm/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

Create `quadrant-fm/vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Add test script**

In `quadrant-fm/package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Copy data + logo into the app**

```bash
cp ../slots.json ./slots.json
cp ../lamamave.png ./public/lamamave.png
```

- [ ] **Step 6: Create `.env.example`**

Create `quadrant-fm/.env.example`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_KEY=
```

- [ ] **Step 7: Init git and commit**

Run from repo root:

```bash
cd ..
git init
git add .
git commit -m "chore: scaffold Next.js app, data, and tooling"
```

Expected: a commit is created. (`.env.local` is git-ignored by create-next-app.)

---

## Task 1: Types and typed slot data

**Files:**
- Create: `quadrant-fm/src/lib/types.ts`
- Create: `quadrant-fm/src/lib/slots-data.ts`

- [ ] **Step 1: Define types**

Create `src/lib/types.ts`:

```ts
export type SlotColor = "roig" | "vermell" | "verd" | "blanc";
export type TableName = "FM" | "FRIGO";

/** Static metadata seeded once. */
export interface SlotMeta {
  id: number;
  table: TableName;
  block: string;
  time: string;
  tag: "Muntatge" | "Desmuntatge" | null;
  color: SlotColor;
  col: string;
}

/** Dynamic state from the DB. */
export interface SlotState {
  id: number;
  taken_by: string | null;
}

/** Merged view used by the UI. */
export interface Slot extends SlotMeta {
  taken_by: string | null;
}

export interface GridRow {
  time: string;
  tag: "Muntatge" | "Desmuntatge" | null;
  cells: (Slot | null)[]; // aligned to the table's column order
}

export interface GridBlock {
  block: string;
  rows: GridRow[];
}

export interface BlockStat {
  block: string;
  free: number;
  total: number;
}

export interface Stats {
  free: number;
  total: number;
  byBlock: BlockStat[];
}
```

- [ ] **Step 2: Typed data export**

Create `src/lib/slots-data.ts`:

```ts
import raw from "../../slots.json";
import type { SlotMeta } from "./types";

// slots.json carries an extra `oldNum` field (provenance) we drop here.
export const SLOTS_META: SlotMeta[] = (raw as Array<SlotMeta & { oldNum: number }>).map(
  ({ oldNum: _oldNum, ...meta }) => meta,
);
```

- [ ] **Step 3: Enable JSON import**

Ensure `quadrant-fm/tsconfig.json` has `"resolveJsonModule": true` under `compilerOptions` (create-next-app sets it; add it if missing).

- [ ] **Step 4: Commit**

```bash
git add quadrant-fm/src/lib/types.ts quadrant-fm/src/lib/slots-data.ts quadrant-fm/tsconfig.json
git commit -m "feat: typed slot metadata"
```

---

## Task 2: Pure grid + stats logic (TDD)

**Files:**
- Create: `quadrant-fm/src/lib/grid.ts`
- Test: `quadrant-fm/src/lib/__tests__/grid.test.ts`

Column order constants: FM uses `["C","D","E","F","G","H","I","J","K","L","M"]`; FRIGO uses `["C","D","E","F"]`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/grid.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildGrid, computeStats, FM_COLS, FRIGO_COLS } from "../grid";
import type { Slot } from "../types";

function slot(p: Partial<Slot>): Slot {
  return {
    id: 1, table: "FM", block: "B1", time: "t1", tag: null,
    color: "verd", col: "C", taken_by: null, ...p,
  };
}

describe("buildGrid", () => {
  it("groups slots by block then by time row, aligned to column order", () => {
    const slots: Slot[] = [
      slot({ id: 1, block: "B1", time: "t1", col: "C" }),
      slot({ id: 2, block: "B1", time: "t1", col: "E" }),
      slot({ id: 3, block: "B1", time: "t2", col: "C" }),
    ];
    const grid = buildGrid(slots, FM_COLS);
    expect(grid).toHaveLength(1);
    expect(grid[0].block).toBe("B1");
    expect(grid[0].rows).toHaveLength(2);
    const row1 = grid[0].rows[0];
    expect(row1.cells[0]?.id).toBe(1); // col C
    expect(row1.cells[1]).toBeNull();  // col D empty
    expect(row1.cells[2]?.id).toBe(2); // col E
  });

  it("preserves the order blocks/rows first appear in the input", () => {
    const slots: Slot[] = [
      slot({ id: 1, block: "Z", time: "t1", col: "C" }),
      slot({ id: 2, block: "A", time: "t1", col: "C" }),
    ];
    const grid = buildGrid(slots, FM_COLS);
    expect(grid.map((g) => g.block)).toEqual(["Z", "A"]);
  });

  it("carries the row tag", () => {
    const slots = [slot({ id: 1, block: "B1", time: "t1", col: "C", tag: "Muntatge" })];
    const grid = buildGrid(slots, FM_COLS);
    expect(grid[0].rows[0].tag).toBe("Muntatge");
  });
});

describe("computeStats", () => {
  it("counts free vs total globally and per block", () => {
    const slots: Slot[] = [
      slot({ id: 1, block: "B1", taken_by: null }),
      slot({ id: 2, block: "B1", taken_by: "Marc" }),
      slot({ id: 3, block: "B2", taken_by: null }),
    ];
    const stats = computeStats(slots);
    expect(stats.total).toBe(3);
    expect(stats.free).toBe(2);
    expect(stats.byBlock).toEqual([
      { block: "B1", free: 1, total: 2 },
      { block: "B2", free: 1, total: 1 },
    ]);
  });
});

describe("column constants", () => {
  it("FM has 11 columns, FRIGO has 4", () => {
    expect(FM_COLS).toHaveLength(11);
    expect(FRIGO_COLS).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd quadrant-fm && npm test`
Expected: FAIL — cannot find module `../grid`.

- [ ] **Step 3: Implement**

Create `src/lib/grid.ts`:

```ts
import type { Slot, GridBlock, GridRow, Stats, BlockStat } from "./types";

export const FM_COLS = ["C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];
export const FRIGO_COLS = ["C", "D", "E", "F"];

export function buildGrid(slots: Slot[], cols: string[]): GridBlock[] {
  const blocks: GridBlock[] = [];
  const blockIndex = new Map<string, GridBlock>();
  const rowIndex = new Map<string, GridRow>();

  for (const s of slots) {
    let block = blockIndex.get(s.block);
    if (!block) {
      block = { block: s.block, rows: [] };
      blockIndex.set(s.block, block);
      blocks.push(block);
    }
    const rowKey = `${s.block} ${s.time}`;
    let row = rowIndex.get(rowKey);
    if (!row) {
      row = { time: s.time, tag: s.tag, cells: cols.map(() => null) };
      rowIndex.set(rowKey, row);
      block.rows.push(row);
    }
    const ci = cols.indexOf(s.col);
    if (ci >= 0) row.cells[ci] = s;
  }
  return blocks;
}

export function computeStats(slots: Slot[]): Stats {
  let free = 0;
  const order: string[] = [];
  const map = new Map<string, BlockStat>();
  for (const s of slots) {
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
  return { free, total: slots.length, byBlock: order.map((b) => map.get(b)!) };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (all grid.test.ts tests green).

- [ ] **Step 5: Commit**

```bash
git add quadrant-fm/src/lib/grid.ts quadrant-fm/src/lib/__tests__/grid.test.ts
git commit -m "feat: pure grid building and stats logic"
```

---

## Task 3: Colour maps

**Files:**
- Create: `quadrant-fm/src/lib/colors.ts`

- [ ] **Step 1: Implement**

Create `src/lib/colors.ts`:

```ts
import type { SlotColor } from "./types";

export const COLOR_HEX: Record<SlotColor, string> = {
  roig: "#E06666",
  vermell: "#F4CCCC",
  verd: "#D9EAD3",
  blanc: "#FFFFFF",
};

export const COLOR_LABEL: Record<SlotColor, string> = {
  roig: "Persones veteranes per cap de barra",
  vermell: "Persones amb experiència (+7 barres)",
  verd: "Persones amb poca o gens experiència",
  blanc: "Indiferent l'experiència que tinguis",
};

export const LEGEND_ORDER: SlotColor[] = ["roig", "vermell", "verd", "blanc"];

/** Text colour that stays readable on each slot background. */
export function textOn(_color: SlotColor): string {
  return "#1a1a1a";
}
```

- [ ] **Step 2: Commit**

```bash
git add quadrant-fm/src/lib/colors.ts
git commit -m "feat: colour legend maps"
```

---

## Task 4: Supabase schema, RPCs, and generated seed

**Files:**
- Create: `quadrant-fm/scripts/gen-seed.mjs`
- Create: `quadrant-fm/supabase/schema.sql`
- Create: `quadrant-fm/supabase/seed.sql` (generated)

- [ ] **Step 1: Write the seed generator**

Create `quadrant-fm/scripts/gen-seed.mjs`:

```js
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const slots = JSON.parse(readFileSync(join(here, "..", "slots.json"), "utf8"));

const esc = (s) => String(s).replace(/'/g, "''");
const val = (v) => (v === null || v === undefined ? "NULL" : `'${esc(v)}'`);

const rows = slots
  .map(
    (s) =>
      `(${s.id}, '${s.table}', '${esc(s.block)}', '${esc(s.time)}', ${val(s.tag)}, '${s.color}', '${s.col}')`,
  )
  .join(",\n");

const sql = `-- GENERATED by scripts/gen-seed.mjs. Do not edit by hand.
insert into public.slots (id, table_name, block, time_label, tag, color, col_pos) values
${rows}
on conflict (id) do update set
  table_name = excluded.table_name,
  block = excluded.block,
  time_label = excluded.time_label,
  tag = excluded.tag,
  color = excluded.color,
  col_pos = excluded.col_pos;
`;

writeFileSync(join(here, "..", "supabase", "seed.sql"), sql);
console.log(`Wrote ${slots.length} slot rows to supabase/seed.sql`);
```

- [ ] **Step 2: Write the schema**

Create `quadrant-fm/supabase/schema.sql`:

```sql
-- Slots table: static metadata + dynamic taken_by/taken_at
create table if not exists public.slots (
  id          int primary key,
  table_name  text not null,
  block       text not null,
  time_label  text not null,
  tag         text,
  color       text not null,
  col_pos     text not null,
  taken_by    text,
  taken_at    timestamptz
);

alter table public.slots enable row level security;

-- Everyone may read.
drop policy if exists slots_read on public.slots;
create policy slots_read on public.slots for select using (true);

-- No direct writes from anon/auth; all writes go through RPCs / service role.

-- Atomic claim: only succeeds if currently free. Returns true on success.
create or replace function public.claim_slot(p_id int, p_person text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated int;
begin
  if p_person is null or length(trim(p_person)) = 0 then
    return false;
  end if;
  update public.slots
     set taken_by = trim(p_person), taken_at = now()
   where id = p_id and taken_by is null;
  get diagnostics updated = row_count;
  return updated = 1;
end;
$$;

-- Release: only the person who took it may free it.
create or replace function public.release_slot(p_id int, p_person text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated int;
begin
  update public.slots
     set taken_by = null, taken_at = null
   where id = p_id and taken_by = trim(p_person);
  get diagnostics updated = row_count;
  return updated = 1;
end;
$$;

grant execute on function public.claim_slot(int, text) to anon, authenticated;
grant execute on function public.release_slot(int, text) to anon, authenticated;
```

- [ ] **Step 3: Generate the seed and verify**

```bash
cd quadrant-fm
node scripts/gen-seed.mjs
```

Expected output: `Wrote 149 slot rows to supabase/seed.sql`. Confirm `supabase/seed.sql` begins with the generated header and contains `insert into public.slots`.

- [ ] **Step 4: Document how to apply (manual, one-time)**

Create `quadrant-fm/supabase/README.md`:

```markdown
# Supabase setup

1. Create a free project at https://supabase.com.
2. Project Settings → API: copy `Project URL`, `anon` key, and `service_role` key.
3. SQL Editor → run `schema.sql`, then run `seed.sql`.
4. Database → Replication: enable Realtime for the `slots` table
   (or run: `alter publication supabase_realtime add table public.slots;`).
5. Put the keys in `.env.local` (see `.env.example`) and in Vercel project env vars.
```

- [ ] **Step 5: Commit**

```bash
cd ..
git add quadrant-fm/scripts/gen-seed.mjs quadrant-fm/supabase/
git commit -m "feat: supabase schema, RPCs, and generated seed"
```

---

## Task 5: Supabase client

**Files:**
- Create: `quadrant-fm/src/lib/supabaseClient.ts`

- [ ] **Step 1: Implement**

Create `src/lib/supabaseClient.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anon, {
  realtime: { params: { eventsPerSecond: 10 } },
});
```

- [ ] **Step 2: Commit**

```bash
git add quadrant-fm/src/lib/supabaseClient.ts
git commit -m "feat: supabase browser client"
```

---

## Task 6: useSlots hook (load + realtime + claim/release)

**Files:**
- Create: `quadrant-fm/src/hooks/useSlots.ts`

- [ ] **Step 1: Implement**

Create `src/hooks/useSlots.ts`:

```ts
"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { SLOTS_META } from "@/lib/slots-data";
import type { Slot, SlotState } from "@/lib/types";

function merge(state: Record<number, string | null>): Slot[] {
  return SLOTS_META.map((m) => ({ ...m, taken_by: state[m.id] ?? null }));
}

export function useSlots() {
  const [taken, setTaken] = useState<Record<number, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("slots").select("id, taken_by");
    if (error) { setError(error.message); return; }
    const map: Record<number, string | null> = {};
    (data as SlotState[]).forEach((r) => { map[r.id] = r.taken_by; });
    setTaken(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("slots-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "slots" },
        (payload) => {
          const row = payload.new as SlotState;
          setTaken((prev) => ({ ...prev, [row.id]: row.taken_by }));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const claim = useCallback(async (id: number, person: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc("claim_slot", { p_id: id, p_person: person });
    if (error) { setError(error.message); return false; }
    if (data === true) setTaken((prev) => ({ ...prev, [id]: person }));
    else await load(); // lost the race; refresh truth
    return data === true;
  }, [load]);

  const release = useCallback(async (id: number, person: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc("release_slot", { p_id: id, p_person: person });
    if (error) { setError(error.message); return false; }
    if (data === true) setTaken((prev) => ({ ...prev, [id]: null }));
    return data === true;
  }, []);

  return { slots: merge(taken), loading, error, claim, release };
}
```

- [ ] **Step 2: Commit**

```bash
git add quadrant-fm/src/hooks/useSlots.ts
git commit -m "feat: useSlots hook with realtime, claim, release"
```

---

## Task 7: NameGate component

**Files:**
- Create: `quadrant-fm/src/components/NameGate.tsx`

- [ ] **Step 1: Implement**

Create `src/components/NameGate.tsx`:

```tsx
"use client";
import { useState } from "react";

export function NameGate({ onEnter }: { onEnter: (name: string) => void }) {
  const [name, setName] = useState("");
  const trimmed = name.trim();
  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-600 p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/lamamave.png" alt="La Mama Ve" className="mx-auto mb-6 w-48" />
        <h1 className="text-xl font-bold mb-4 text-gray-800">Quadrant Festa Major 2026</h1>
        <form
          onSubmit={(e) => { e.preventDefault(); if (trimmed) onEnter(trimmed); }}
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="El teu nom"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 text-center"
          />
          <button
            type="submit"
            disabled={!trimmed}
            className="w-full bg-pink-600 text-white font-semibold rounded-lg py-3 disabled:opacity-40"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add quadrant-fm/src/components/NameGate.tsx
git commit -m "feat: name gate screen"
```

---

## Task 8: SlotCell component (TDD)

**Files:**
- Create: `quadrant-fm/src/components/SlotCell.tsx`
- Test: `quadrant-fm/src/components/__tests__/SlotCell.test.tsx`

Behaviour: free → shows the slot number on its legend colour, clickable to claim. Taken by someone else → shows that name, not clickable. Taken by me → shows my name + a release affordance.

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/SlotCell.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SlotCell } from "../SlotCell";
import type { Slot } from "@/lib/types";

const base: Slot = {
  id: 5, table: "FM", block: "B", time: "t", tag: null,
  color: "verd", col: "C", taken_by: null,
};

describe("SlotCell", () => {
  it("free slot shows its number and calls onClaim when clicked", () => {
    const onClaim = vi.fn();
    render(<SlotCell slot={base} myName="Marc" onClaim={onClaim} onRelease={vi.fn()} />);
    expect(screen.getByText("5")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(onClaim).toHaveBeenCalledWith(5);
  });

  it("slot taken by someone else shows the name and does not claim", () => {
    const onClaim = vi.fn();
    render(
      <SlotCell slot={{ ...base, taken_by: "Anna" }} myName="Marc" onClaim={onClaim} onRelease={vi.fn()} />,
    );
    expect(screen.getByText("Anna")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Anna"));
    expect(onClaim).not.toHaveBeenCalled();
  });

  it("slot taken by me calls onRelease when clicked", () => {
    const onRelease = vi.fn();
    render(
      <SlotCell slot={{ ...base, taken_by: "Marc" }} myName="Marc" onClaim={vi.fn()} onRelease={onRelease} />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onRelease).toHaveBeenCalledWith(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot find module `../SlotCell`.

- [ ] **Step 3: Implement**

Create `src/components/SlotCell.tsx`:

```tsx
"use client";
import type { Slot } from "@/lib/types";
import { COLOR_HEX, textOn } from "@/lib/colors";

interface Props {
  slot: Slot;
  myName: string;
  onClaim: (id: number) => void;
  onRelease: (id: number) => void;
}

export function SlotCell({ slot, myName, onClaim, onRelease }: Props) {
  const free = slot.taken_by === null;
  const mine = slot.taken_by === myName;

  if (free) {
    return (
      <button
        onClick={() => onClaim(slot.id)}
        title={`Plaça lliure (${slot.color})`}
        className="h-14 w-full rounded-md border border-black/10 text-sm font-bold transition hover:scale-[1.04] hover:shadow"
        style={{ background: COLOR_HEX[slot.color], color: textOn(slot.color) }}
      >
        {slot.id}
      </button>
    );
  }

  return (
    <button
      onClick={() => mine && onRelease(slot.id)}
      disabled={!mine}
      title={mine ? "Toca per alliberar la teva plaça" : `Ocupada per ${slot.taken_by}`}
      className={`h-14 w-full rounded-md border text-xs font-semibold leading-tight px-1 overflow-hidden ${
        mine
          ? "bg-pink-600 text-white border-pink-700 cursor-pointer"
          : "bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed"
      }`}
    >
      <span className="block truncate">{slot.taken_by}</span>
      <span className="block text-[10px] opacity-70">#{slot.id}{mine ? " · treure" : ""}</span>
    </button>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (SlotCell.test.tsx green; grid.test.ts still green).

- [ ] **Step 5: Commit**

```bash
git add quadrant-fm/src/components/SlotCell.tsx quadrant-fm/src/components/__tests__/SlotCell.test.tsx
git commit -m "feat: slot cell with claim/release states"
```

---

## Task 9: Legend and StatsBar components

**Files:**
- Create: `quadrant-fm/src/components/Legend.tsx`
- Create: `quadrant-fm/src/components/StatsBar.tsx`

- [ ] **Step 1: Implement Legend**

Create `src/components/Legend.tsx`:

```tsx
import { COLOR_HEX, COLOR_LABEL, LEGEND_ORDER } from "@/lib/colors";

export function Legend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {LEGEND_ORDER.map((c) => (
        <span key={c} className="flex items-center gap-1.5">
          <span
            className="inline-block h-4 w-4 rounded border border-black/20"
            style={{ background: COLOR_HEX[c] }}
          />
          {COLOR_LABEL[c]}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Implement StatsBar**

Create `src/components/StatsBar.tsx`:

```tsx
import type { Stats } from "@/lib/types";

export function StatsBar({ stats }: { stats: Stats }) {
  const pct = stats.total ? Math.round(((stats.total - stats.free) / stats.total) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="font-bold text-gray-800">
          {stats.free} / {stats.total} places lliures
        </span>
        <span className="text-xs text-gray-500">{pct}% cobert</span>
      </div>
      <div className="h-2 w-full rounded bg-gray-200 overflow-hidden">
        <div className="h-full bg-pink-600" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
        {stats.byBlock.map((b) => (
          <span key={b.block}>
            {b.block}: <strong>{b.free}</strong>/{b.total}
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add quadrant-fm/src/components/Legend.tsx quadrant-fm/src/components/StatsBar.tsx
git commit -m "feat: legend and stats bar"
```

---

## Task 10: ShiftGrid component (renders one table)

**Files:**
- Create: `quadrant-fm/src/components/ShiftGrid.tsx`

- [ ] **Step 1: Implement**

Create `src/components/ShiftGrid.tsx`:

```tsx
"use client";
import type { Slot } from "@/lib/types";
import { buildGrid } from "@/lib/grid";
import { SlotCell } from "./SlotCell";

interface Props {
  title: string;
  slots: Slot[];
  cols: string[];
  myName: string;
  onClaim: (id: number) => void;
  onRelease: (id: number) => void;
}

export function ShiftGrid({ title, slots, cols, myName, onClaim, onRelease }: Props) {
  const blocks = buildGrid(slots, cols);
  // grid template: time label + tag + one column per slot column
  const gridCols = `120px 110px repeat(${cols.length}, minmax(72px, 1fr))`;

  return (
    <section className="mb-10">
      <h2 className="text-lg font-extrabold text-pink-700 mb-3">{title}</h2>
      <div className="overflow-x-auto">
        <div className="min-w-max space-y-6">
          {blocks.map((block) => (
            <div key={block.block}>
              <h3 className="text-sm font-bold text-gray-700 mb-2">{block.block}</h3>
              <div className="space-y-1.5">
                {block.rows.map((row, i) => (
                  <div key={i} className="grid items-stretch gap-1.5" style={{ gridTemplateColumns: gridCols }}>
                    <div className="flex items-center text-xs font-semibold text-gray-700">{row.time}</div>
                    <div className="flex items-center text-xs italic text-gray-500">{row.tag ?? ""}</div>
                    {row.cells.map((cell, ci) =>
                      cell ? (
                        <SlotCell key={ci} slot={cell} myName={myName} onClaim={onClaim} onRelease={onRelease} />
                      ) : (
                        <div key={ci} className="h-14 w-full rounded-md bg-gray-100 border border-gray-200" />
                      ),
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add quadrant-fm/src/components/ShiftGrid.tsx
git commit -m "feat: shift grid renderer with grey gaps preserved"
```

---

## Task 11: Main page assembly + theming

**Files:**
- Modify: `quadrant-fm/src/app/page.tsx` (replace generated content)
- Modify: `quadrant-fm/src/app/layout.tsx` (title/lang)
- Modify: `quadrant-fm/src/app/globals.css` (keep Tailwind directives; remove demo styles)

- [ ] **Step 1: Replace the page**

Replace the entire contents of `src/app/page.tsx` with:

```tsx
"use client";
import { useEffect, useState } from "react";
import { useSlots } from "@/hooks/useSlots";
import { computeStats, FM_COLS, FRIGO_COLS } from "@/lib/grid";
import { NameGate } from "@/components/NameGate";
import { Legend } from "@/components/Legend";
import { StatsBar } from "@/components/StatsBar";
import { ShiftGrid } from "@/components/ShiftGrid";

const NAME_KEY = "quadrant-fm-name";

export default function Home() {
  const [name, setName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const { slots, loading, error, claim, release } = useSlots();

  useEffect(() => {
    setName(localStorage.getItem(NAME_KEY));
    setReady(true);
  }, []);

  if (!ready) return null;
  if (!name) {
    return (
      <NameGate
        onEnter={(n) => { localStorage.setItem(NAME_KEY, n); setName(n); }}
      />
    );
  }

  const fm = slots.filter((s) => s.table === "FM");
  const frigo = slots.filter((s) => s.table === "FRIGO");
  const stats = computeStats(slots);

  return (
    <main className="min-h-screen bg-pink-50">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-pink-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 space-y-3">
          <div className="flex items-center justify-between gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/lamamave.png" alt="La Mama Ve" className="h-9" />
            <div className="text-sm text-gray-600">
              Hola, <strong className="text-pink-700">{name}</strong>{" "}
              <button
                onClick={() => { localStorage.removeItem(NAME_KEY); setName(null); }}
                className="underline text-gray-400 ml-1"
              >
                canviar
              </button>
            </div>
          </div>
          <StatsBar stats={stats} />
          <Legend />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {error && <p className="text-red-600 mb-4">Error: {error}</p>}
        {loading ? (
          <p className="text-gray-500">Carregant…</p>
        ) : (
          <>
            <ShiftGrid title="Prèvia i Festa Major" slots={fm} cols={FM_COLS}
              myName={name} onClaim={(id) => claim(id, name)} onRelease={(id) => release(id, name)} />
            <ShiftGrid title="Frigofiesta" slots={frigo} cols={FRIGO_COLS}
              myName={name} onClaim={(id) => claim(id, name)} onRelease={(id) => release(id, name)} />
          </>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Update layout metadata**

In `src/app/layout.tsx`, set `lang="ca"` on `<html>` and the metadata:

```tsx
export const metadata = {
  title: "Quadrant FM 2026 · La Mama Ve",
  description: "Apunta't als torns de la festa major",
};
```

- [ ] **Step 3: Clean globals.css**

Ensure `src/app/globals.css` keeps only the Tailwind import line(s) generated by create-next-app (e.g. `@import "tailwindcss";`) and remove any demo `:root`/dark-mode demo rules that fight the pink theme. Leave Tailwind intact.

- [ ] **Step 4: Build to verify it compiles**

Run: `cd quadrant-fm && npm run build`
Expected: build succeeds (type-checks pass). Runtime data needs env vars (Task 13) but the build must not error.

- [ ] **Step 5: Commit**

```bash
cd ..
git add quadrant-fm/src/app/
git commit -m "feat: main page, theming, and assembly"
```

---

## Task 12: Admin (release any / clear all)

**Files:**
- Create: `quadrant-fm/src/app/api/admin/release/route.ts`
- Create: `quadrant-fm/src/app/api/admin/clear/route.ts`
- Create: `quadrant-fm/src/app/admin/page.tsx`

- [ ] **Step 1: Release API route**

Create `src/app/api/admin/release/route.ts`:

```ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { key, id } = await req.json();
  if (key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { error } = await admin
    .from("slots")
    .update({ taken_by: null, taken_at: null })
    .eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Clear-all API route**

Create `src/app/api/admin/clear/route.ts`:

```ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { key } = await req.json();
  if (key !== process.env.ADMIN_KEY) {
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
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Admin page**

Create `src/app/admin/page.tsx`:

```tsx
"use client";
import { useState } from "react";

export default function Admin() {
  const [key, setKey] = useState("");
  const [id, setId] = useState("");
  const [msg, setMsg] = useState("");

  async function release() {
    const r = await fetch("/api/admin/release", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, id: Number(id) }),
    });
    setMsg((await r.json()).ok ? `Plaça ${id} alliberada` : "Error / clau incorrecta");
  }
  async function clearAll() {
    if (!confirm("Segur que vols buidar TOTES les places?")) return;
    const r = await fetch("/api/admin/clear", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    setMsg((await r.json()).ok ? "Totes les places buidades" : "Error / clau incorrecta");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-xl shadow p-6 w-full max-w-sm space-y-3">
        <h1 className="font-bold text-lg">Admin · Quadrant FM</h1>
        <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="Clau d'admin"
          type="password" className="w-full border rounded px-3 py-2" />
        <div className="flex gap-2">
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="Nº plaça"
            className="flex-1 border rounded px-3 py-2" />
          <button onClick={release} className="bg-pink-600 text-white rounded px-4">Alliberar</button>
        </div>
        <button onClick={clearAll} className="w-full bg-red-600 text-white rounded py-2">Buidar-ho tot</button>
        {msg && <p className="text-sm text-gray-700">{msg}</p>}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Build to verify**

Run: `cd quadrant-fm && npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
cd ..
git add quadrant-fm/src/app/admin quadrant-fm/src/app/api
git commit -m "feat: admin release and clear-all"
```

---

## Task 13: Local end-to-end verification

**Files:** none (manual verification with real Supabase project)

- [ ] **Step 1: Provision Supabase**

Follow `quadrant-fm/supabase/README.md`: create project, run `schema.sql` then `seed.sql`, enable Realtime on `slots`.

- [ ] **Step 2: Fill `.env.local`**

Create `quadrant-fm/.env.local` with the four values from `.env.example` (URL, anon key, service role key, a chosen ADMIN_KEY).

- [ ] **Step 3: Run dev server**

Run: `cd quadrant-fm && npm run dev`
Open http://localhost:3000.

- [ ] **Step 4: Verify the flow**

- Enter a name → grid shows 149 slots with correct colours and the legend.
- Stats reads `149 / 149 places lliures`.
- Click a free slot → it turns pink with your name; stats decrement.
- Open a second browser/incognito with a different name → the claimed slot already shows the first name and is locked (realtime).
- Claim the same slot from the second browser → it does not change owner (atomic claim).
- Click your own slot → it frees; second browser sees it free in <1s.
- Visit `/admin`, enter ADMIN_KEY, release a slot / clear all → reflected live.

- [ ] **Step 5: Commit any fixes found**

```bash
git add -A && git commit -m "fix: issues found during local e2e"
```

(If nothing needed fixing, skip.)

---

## Task 14: Deploy to GitHub + Vercel

**Files:** none

- [ ] **Step 1: Push to GitHub**

```bash
gh repo create quadrant-fm --private --source=. --remote=origin --push
```

(Or create the repo in the GitHub UI and `git remote add origin … && git push -u origin main`.)

- [ ] **Step 2: Import to Vercel**

In Vercel: New Project → import the GitHub repo. Set the **Root Directory** to `quadrant-fm`.

- [ ] **Step 3: Set environment variables in Vercel**

Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_KEY` (Production + Preview).

- [ ] **Step 4: Deploy and smoke-test**

Trigger the deploy. Open the production URL, repeat the Task 13 Step 4 flow against the live site (two devices). Confirm realtime works on the deployed domain.

- [ ] **Step 5: Tag the release**

```bash
git tag v1.0.0 && git push --tags
```

---

## Notes / accepted limitations
- Identity is name-only: someone could type another person's name to release their slot. Accepted for this festa-major tool (documented in the spec). Upgrade path: add a per-person PIN to the RPC checks.
- Supabase free tier comfortably handles 50 concurrent realtime clients and the slot volume.
- `slots.json` is the single source of truth for slot metadata. To change the grid, edit it and re-run `node scripts/gen-seed.mjs`, then re-apply `seed.sql`.
