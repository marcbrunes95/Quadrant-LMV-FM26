# 🎪 Quadrant LMV — La Mama Ve

Quadrant de voluntaris de **La Mama Ve**: una web mòbil perquè la colla s'apunti
en temps real als torns (barra, cuina, muntatge…) dels esdeveniments — **Festa
Major** i **Gatzara Sonora** — identificant-se amb el número de soci, amb places
limitades per franja i nivells d'experiència per colors.

Resol el clàssic caos del quadrant en paper o full de càlcul compartit: cadascú
s'apunta des del mòbil, les places s'ocupen de forma atòmica (sense trepitjar-se),
i tothom veu l'estat al moment gràcies al temps real.

---

## ✨ Funcionalitats principals

- **Selector d'esdeveniments** a l'entrada (Gatzara Sonora · actiu / Festa Major · finalitzat).
- **Login per número de soci (DNI)** contra un roster privat; el nom queda
  visible al quadrant però la propietat de la plaça és sempre per DNI.
- **Graella de torns per dies i franges** amb colors per nivell d'experiència
  (roig = veterans/cap de barra · vermell = experiència · verd = poca/gens · blanc = indiferent).
- **Apuntar-se i alliberar plaça en temps real** (Supabase realtime): tothom veu
  els canvis a l'instant sense refrescar.
- **Regles anti-conflicte**: una plaça per persona i franja (atòmic a la BD) +
  bloqueig si dues franges del mateix dia se solapen en hores.
- **% d'ocupació i medalles per esdeveniment** (FM: bronze/plata/or a 1/3/5
  torns · Gatzara: 1/2/3), amb confeti en assolir plata i or 🎉.
- **Esdeveniments congelats**: quan un esdeveniment acaba, queda en mode
  només-consulta (es veu tot, no es pot tocar res).
- **Panell d'administració** (`/admin`, protegit per clau): alliberar una plaça,
  historial complet d'accions amb export a CSV, i buidat total.

## 🛠 Stack tecnològic

| Capa | Tecnologia |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) + React 19 |
| Llenguatge | TypeScript (mode `strict`) |
| Estils | Tailwind CSS 4 |
| Base de dades + realtime | [Supabase](https://supabase.com) (Postgres, RPCs, subscripcions realtime) |
| Tests | Vitest + Testing Library (jsdom) |
| Desplegament | [Vercel](https://vercel.com) (deploy automàtic amb cada push a `main`) |

## 📁 Estructura del projecte

```
Quadrant-motors-LMV/
├── quadrant-fm/                 # ← L'aplicació Next.js
│   ├── src/app/                 # Rutes: / (selector), /fm, /gatzara, /admin, /api/*
│   │   └── api/                 # login (roster per DNI) i admin (release/history/clear)
│   ├── src/components/          # EventPage (pàgina d'esdeveniment), ShiftGrid, SlotCell,
│   │                            # NameGate (login), StatsBar, MedalBadge, Confetti, Legend
│   ├── src/lib/                 # grid.ts (graella), franja.ts (solapaments), events.ts
│   │                            # (config FM/Gatzara), slots-data.ts, colors.ts, types.ts
│   ├── src/hooks/useSlots.ts    # Dades + realtime + claim/release per esdeveniment
│   ├── slots.json               # ⭐ Metadata estàtica de TOTES les places (estructura,
│   │                            #    horaris, colors) — la font de la veritat de l'estructura
│   ├── scripts/                 # gen-gatzara.mjs i seed-gatzara.mjs (idempotents)
│   ├── supabase/                # SQL: schema, seed, history, identity, one-per-franja, gatzara
│   │   └── _private/            # Roster real (DNIs) — NO es puja a git
│   └── DESPLEGAMENT.md          # Guia pas a pas de Supabase + GitHub + Vercel
├── docs/superpowers/            # Specs i plans de desenvolupament (per data)
└── *.xlsx / *.pdf               # Fitxers de treball (quadrants exportats, programa de festes)
```

> **Concepte clau**: `slots.json` (compilat al bundle) defineix l'estructura i els
> horaris; la BD només guarda **qui** ocupa cada plaça (`taken_by`). Un canvi
> d'horari s'ha de fer al codi **i** sincronitzar a la BD, i desplegar.

## 📋 Prerequisits

- **Node.js 20 o superior** (provat amb Node 24) i npm.
- Un projecte a **Supabase** (pla gratuït suficient).
- Compte a **Vercel** (només per desplegar).

## 🚀 Instal·lació i configuració

```bash
# 1. Clona el repo
git clone https://github.com/marcbrunes95/Quadrant-LMV-FM26.git
cd Quadrant-LMV-FM26/quadrant-fm

# 2. Instal·la dependències
npm install

# 3. Configura la base de dades (Supabase → SQL Editor, en aquest ordre)
#    schema.sql → seed.sql → history.sql → identity.sql →
#    _private/roster-data.sql (privat) → one-per-franja.sql → gatzara.sql
#    i activa el realtime:
#    alter publication supabase_realtime add table public.slots;

# 4. Crea quadrant-fm/.env.local amb les variables de la taula següent

# 5. Arrenca en desenvolupament
npm run dev   # → http://localhost:3000
```

## 🔐 Variables d'entorn

Es defineixen a `quadrant-fm/.env.local` en local (està al `.gitignore`) i al
panell de Vercel en producció. **Mai posis els valors al repositori.**

| Variable | Què fa | Obligatòria | Sensibilitat |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del projecte Supabase | ✅ | Baixa (pública) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clau pública del navegador (lectura + RPCs, protegida per RLS) | ✅ | Baixa (pública per disseny) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clau mestra **només de servidor** (login per DNI, admin, seeds) | ✅ | 🔴 **Alta** — mai al client ni a git |
| `ADMIN_KEY` | Contrasenya del panell `/admin` | Per a `/admin` | 🔴 Alta |

## ▶️ Ús i execució

```bash
npm run dev      # desenvolupament amb hot-reload
npm run build    # build de producció
npm run start    # servir el build en local

# Scripts de dades (idempotents: re-executar-los mai duplica ni trenca res)
node scripts/gen-gatzara.mjs    # regenera la metadata Gatzara dins slots.json
node scripts/seed-gatzara.mjs   # insereix els slots Gatzara a la BD (mai toca FM)
```

**Desplegament**: cada `git push` a `main` desplega automàticament a Vercel
(root directory: `quadrant-fm`). Guia completa a
[quadrant-fm/DESPLEGAMENT.md](quadrant-fm/DESPLEGAMENT.md).

## 🧪 Tests i linters

```bash
npm test             # Vitest, una passada (unit tests de grid, franja, medalles, slots-data, SlotCell)
npm run test:watch   # en mode watch
npm run lint         # ESLint (config Next core-web-vitals + TypeScript)
npx tsc --noEmit     # comprovació de tipus
```

Porta de qualitat abans de qualsevol push: `npm test && npx tsc --noEmit && npm run build`.

## 🔧 Administració

A `EL_TEU_DOMINI/admin` (cal l'`ADMIN_KEY`):
- **Alliberar una plaça** concreta pel seu número intern.
- **Historial** de totes les accions (qui ha agafat/alliberat què i quan), amb **export a CSV**.
- **Buidar totes les places** (amb confirmació — irreversible).

## 👤 Autoria i llicència

Fet per **Marc Brunes** per a **La Mama Ve** 🎪 amb l'ajuda de Claude Code.

**Ús intern de la colla — tots els drets reservats.** Aquest codi no té
llicència pública; no està autoritzada la seva reutilització fora de
l'entitat sense permís.
