# Tardeo final d'estiu — disseny

Data: 2026-09-09 · Estat: aprovat per Marc

Tercer esdeveniment del Quadrant LMV, després de Festa Major i Gatzara Sonora.
Un sol dia (dissabte 19/09/2026), 52 places, de les quals només la meitat són
de La Mama Ve: la resta les cobreix una altra colla i han de sortir al quadrant
com a bloquejades.

## Objectius

1. Publicar el quadrant del Tardeo a `/tardeo`, obert a inscripcions.
2. Mostrar les places de l'altra colla amb el seu número però sense que ningú
   de La Mama Ve les pugui agafar ni que distorsionin el percentatge de cobertura.
3. Poder escriure més endavant els noms que l'altra colla faciliti, sense deploy.
4. Ensenyar un compte enrere fins al 19/09/2026 a les 19:00.

## Fora d'abast

- Tancar les inscripcions automàticament en arribar l'hora. El compte enrere és
  només informatiu; congelar l'esdeveniment seguirà sent `frozen: true` + deploy.
- Nivells d'experiència (roig/vermell/verd) en aquest esdeveniment.
- Retocar FM (ids 1-149) o Gatzara (ids 201-251).

## Font de dades

`Activitats tardeo.xlsx`, pestanya **Tardeo**, rang **M2:V15**. El farciment de
cada cel·la determina el tipus de plaça:

| Farciment | Significat |
|---|---|
| `#C27BA0` | Plaça de La Mama Ve (es pot agafar) |
| `#666666` | Plaça bloquejada (altra colla) |
| `#D9D9D9` | Cel·la buida, no és cap plaça |
| `#000000` | Separador visual (files 3 i 14) |
| `#9FC5E8` | Capçalera de rol (CAP BARRA / CAP CUINA) |

Recompte verificat llegint l'XML del full: **26 places de La Mama Ve i 26
bloquejades**, 52 en total.

## Estructura de places

Un sol bloc, `Dia 19/09`. La columna `col` reprodueix la columna d'Excel, com
ja fa Gatzara. Ids interns **301-352**, `num` visible **1-52** (`id = 300 + num`).

| Franja | Tag | Col N | O | P | Q | R | S | T | U |
|---|---|---|---|---|---|---|---|---|---|
| 10:30 | Muntatge | 1 | 2 | 3 | 4· | 5· | 6· | | |
| 19:00-21:00 | — | 7 | 8· | 9· | 10· | 11 | 12· | 13 | 14· |
| 20:50-22:30 | — | | | 15 | 16 | 17· | 18 | 19 | 20· |
| 22:20-00:00 | — | | | 21· | 22· | 23 | 24· | 25 | 26· |
| 23:50-1:15 | — | | | 27 | 28 | 29· | 30 | 31 | 32· |
| 1:05-2:30 | — | | | 33· | 34· | 35 | 36 | 37 | 38· |
| 18:00-22:00 | — | | | | | 39· | | | |
| 18:00-20:00 | — | | | | | | 40 | 41· | |
| 20:00-22:00 | — | | | 42· | 43 | | 44 | 45· | |
| 22:00-0:00 | — | | | 46 | | | | | |
| 2:00-4:00 | Desmuntatge | 47 | 48 | 49 | 50· | 51· | 52· | | |

Les places marcades amb `·` són bloquejades. La 39 (CAP CUINA) està fusionada
a l'Excel sobre 18:00-20:00 i 20:00-22:00, i per tant té franja pròpia
**18:00-22:00**, com el CAP DE PISTA de Gatzara.

Els noms de rol (CATA, BARMANS, CAP BARRA, COBRANT, PATATERO, CUINA, CAP CUINA,
MUNTAR/SERVIR) **no** es mostren: `tag` només porta `Muntatge` i `Desmuntatge`.
Totes les places tenen `color: "blanc"` i la llegenda de colors queda amagada.

## Canvis de codi

### Tipus (`src/lib/types.ts`)
- `EventId` += `"tardeo"`, `TableName` += `"TARDEO"`.
- `SlotMeta` += `blocked?: boolean` — plaça reservada a una altra colla.

### Graella (`src/lib/grid.ts`)
- `TARDEO_COLS = ["N","O","P","Q","R","S","T","U"]`.
- `computeStats` ignora les places amb `blocked` tant a `total` com a `free`,
  a l'agregat i per bloc. El percentatge passa a ser sobre 26, no sobre 52.

### Configuració (`src/lib/events.ts`)
- `EventConfig` += `countdownTo?: string` (ISO amb zona) i `showLegend?: boolean`
  (per defecte cert).
- `TARDEO_EVENT`: medalles 1/2/3, `frozen: false`,
  `countdownTo: "2026-09-19T19:00:00+02:00"`, `showLegend: false`,
  una sola graella amb `title: ""`.

### Compte enrere
- `src/lib/countdown.ts`: funció pura `countdownParts(targetIso, now)` que
  retorna `{ days, hours, minutes }` o `null` si ja ha passat, i
  `formatCountdown(parts)` amb el text en català.
- `src/components/Countdown.tsx`: client, calcula només després de muntar
  (evita el desajust d'hidratació entre servidor i navegador) i refresca cada
  minut. Es renderitza al header d'`EventPage` només si hi ha `countdownTo`.

### Places bloquejades a la interfície
- `SlotCell`: si `slot.blocked`, cel·la de fons `#666666` amb el número; si té
  `taken_by`, mostra el nom a sota. El clic no reclama res: dispara un toast
  «Plaça N · reservada per una altra colla».
- `EventPage.handleClaim` surt d'hora si la plaça és bloquejada, i les
  bloquejades no compten mai com a `mine`.
- `ShiftGrid`: no dibuixa l'`<h2>` si `title` és buit.
- `Legend` només es dibuixa si `config.showLegend !== false`.

### Ruta i selector
- `src/app/tardeo/page.tsx` → `<EventPage config={TARDEO_EVENT} />`.
- Targeta nova a dalt de tot de `/`: «TARDEO FINAL D'ESTIU», «Dissabte 19 de
  setembre», emoji `🌅`, badge rosa «Obert».

## Canvis de base de dades

`supabase/tardeo.sql`, idempotent, executat manualment al SQL Editor:

1. `alter table public.slots add column if not exists blocked boolean not null default false;`
   FM i Gatzara queden a `false` sense tocar-les.
2. `claim_slot` retorna `'blocked'` quan la plaça ho està, abans de qualsevol
   `update`. Sense això, la protecció seria només del navegador i n'hi hauria
   prou amb la consola per saltar-se-la.

`scripts/seed-tardeo.mjs`: insereix les 52 files amb `ignoreDuplicates`, mai
toca ids inferiors a 301. Desa un backup JSON de l'estat previ.

## Escriure els noms de l'altra colla

Endpoint nou `POST /api/admin/assign` amb la mateixa clau d'admin que
`release` i `clear`: rep `{ id, name }`, escriu `taken_by` amb el rol de
servei i només accepta places amb `blocked = true`. A `/admin`, un camp de
número + nom i un botó. Així els noms es poden posar i treure sense deploy, i
segueixen sense comptar al percentatge de La Mama Ve.

## Solapaments

La regla existent (una plaça per franja exacta a la BD, més bloqueig per
solapament d'hores del mateix bloc al client) ja tracta bé les hores de
matinada. Conseqüències volgudes en aquest quadrant:

- Cuina 18:00-20:00 xoca amb barra 19:00-21:00.
- Cuina 20:00-22:00 xoca amb 20:50-22:30.
- 1:05-2:30 xoca amb el desmuntatge 2:00-4:00.
- El muntatge de les 10:30 no té rang horari, i per tant no bloqueja res.

## Proves

- `countdown.test.ts`: dies/hores/minuts, objectiu ja passat, i la data amb zona +02:00 llegida correctament sigui quina sigui la zona del navegador.
- `grid.test.ts`: `computeStats` exclou les bloquejades, a l'agregat i per bloc.
- `franja.test.ts`: els quatre solapaments de la secció anterior.
- `slots-data` del Tardeo: 52 places, ids 301-352 sense forats, `num` 1-52
  únics, 26 bloquejades, i FM (149) i Gatzara (51) intactes.
- `SlotCell`: una plaça bloquejada no crida `onClaim`.

## Desplegament

1. Backup JSON de l'estat de la BD.
2. `supabase/tardeo.sql` al SQL Editor.
3. `node scripts/gen-tardeo.mjs` i `node scripts/seed-tardeo.mjs`.
4. Porta de qualitat: `npm test && npx tsc --noEmit && npm run build`.
5. Push només amb l'OK explícit de Marc.
