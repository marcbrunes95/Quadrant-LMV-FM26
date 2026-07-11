# CLAUDE.md — Quadrant LMV (La Mama Ve)

Normes de projecte per a sessions de Claude Code. L'app viu a `quadrant-fm/`
(el seu `CLAUDE.md` → `AGENTS.md` conté la nota de Next.js 16: **llegeix la doc
de `node_modules/next/dist/docs/` abans d'escriure codi Next** — hi ha breaking
changes respecte al teu entrenament).

## Què és aquest repo

Quadrant de voluntaris de La Mama Ve: web mòbil perquè la colla s'apunti en
temps real als torns (barra, cuina, muntatge…) dels esdeveniments — Festa Major
i Gatzara Sonora — identificant-se amb el número de soci (DNI), amb places
limitades per franja i nivells d'experiència per colors.

- L'aplicació Next.js és a `quadrant-fm/`.
- L'arrel conté fitxers de treball (Excel/PDF de quadrants, programa de festes)
  i `docs/superpowers/` amb les specs i plans de desenvolupament.

## Stack

| Capa | Eina |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Llenguatge | TypeScript `strict` (alias `@/` → `quadrant-fm/src/`) |
| Estils | Tailwind CSS 4 |
| BD / realtime | Supabase (Postgres + RPCs + realtime) via `@supabase/supabase-js` |
| Tests | Vitest + @testing-library/react (jsdom) |
| Desplegament | Vercel — **cada push a `main` desplega automàticament** (root dir: `quadrant-fm`) |

## Arquitectura de dades (CRÍTIC — font d'errors si s'oblida)

- `quadrant-fm/slots.json` és la metadata **ESTÀTICA** de totes les places:
  estructura, blocs (dies), horaris, colors, `event`, `num`. Es compila al bundle.
- La taula `slots` de Supabase només mana en l'estat **DINÀMIC**: `taken_by`,
  `taken_at` (les altres columnes són còpia informativa).
- ⚠️ **La web NO llegeix horaris de la BD.** Canviar un horari o l'estructura
  vol dir: (1) editar `slots.json`, (2) sincronitzar la BD (`slots.time_label`
  **i** `slot_owner.franja_key`, amb backup previ), (3) commit + push (deploy).
- Esdeveniments: camp `event` a la metadata (absent = `"fm"`). FM = ids 1-149.
  Gatzara = ids **201-251** amb `num` 1-51 (el número visible a la UI; l'`id`
  intern sempre mana a claim/release).
- Identitat **sempre per DNI**, mai per nom (hi ha noms repetits): roster
  privat server-only (`/api/login` amb service role), propietat a `slot_owner`.
- Regles de places: RPCs atòmiques `claim_slot`/`release_slot`/`my_slots`;
  1 plaça per franja exacta (BD) + bloqueig per solapament d'hores del mateix
  dia (client, `src/lib/franja.ts`).
- Esdeveniments amb `frozen: true` a `src/lib/events.ts` són només consulta
  (FM ho està des de juliol 2026).
- Medalles per esdeveniment: FM bronze/plata/or = 1/3/5 · Gatzara = 1/2/3.

## Regles d'or

1. **MAI tocar les dades FM (ids 1-149) ni cap inscripció existent** sense OK
   explícit de Marc.
2. **MAI `git push` sense OK explícit de Marc** (push = deploy a producció).
3. **MAI escriure a la BD de producció sense OK explícit**; abans de canvis,
   desa un backup JSON de l'estat (patró `quadrant-fm/horari-backup*.json`).
4. `.env.local` i claus **mai** a git ni al codi (ja és al `.gitignore`).
5. Seeds i migracions **idempotents** (`on conflict do nothing` /
   `ignoreDuplicates`), re-executables sense perill.
6. `supabase/_private/` (roster amb DNIs reals) no es puja mai a git.

## Comandes (sempre des de `quadrant-fm/`)

```bash
npm run dev          # servidor local (http://localhost:3000)
npm run build        # build de producció
npm run lint         # ESLint
npm test             # Vitest (una passada)
npm run test:watch   # Vitest en mode watch

node scripts/gen-gatzara.mjs    # regenera metadata Gatzara a slots.json (idempotent)
node scripts/seed-gatzara.mjs   # INSERT de slots Gatzara a la BD (idempotent, mai toca FM)
```

**Porta de qualitat abans de qualsevol push:**
`npm test && npx tsc --noEmit && npm run build` — tot verd.

## Estil de codi

- Components funcionals + hooks; `"use client"` només on cal.
- **UI en català; codi, noms i comentaris en anglès.** Comenta el *perquè*, no el *què*.
- TDD per a lògica nova de `src/lib/` (tests a `__tests__/`, primer el test que falla).
- UI: paleta rosa — `#fa3c92` (principal), `#ffebf4` (fons targetes), `#3d001c`
  (fosc); botons «píndola» (`rounded-full bg-pink-600 text-white text-[11px]
  font-semibold px-2.5 py-1`); toasts foscos centrats a baix.

## Commits i documentació

- Commits: `tipus: missatge en català` (`feat:` / `fix:` / `style:` / `chore:` /
  `docs:`), petits i temàtics.
- Specs a `docs/superpowers/specs/` i plans a `docs/superpowers/plans/`
  (format `YYYY-MM-DD-tema.md`).

## Comunicació

- Respostes a Marc en **català**, directes i executives; davant d'ambigüitat
  rellevant, pregunta abans d'assumir (vegeu el CLAUDE.md global de l'usuari).
