# Gatzara — segon esdeveniment al quadrant (disseny)

Data: 2026-07-09 · Estat: aprovat per Marc

## Objectiu

Afegir un segon esdeveniment, **Gatzara (16-17 juliol 2026)**, a l'app quadrant-fm,
amb selector d'esdeveniment a l'entrada, graella pròpia (51 places segons el full
"Gatzara" d'`Activitats.xlsx`, cols L-T), i **% d'ocupació i medalles individuals
per esdeveniment**. Les dades existents de FM no es toquen.

## No-objectius

- Cap canvi a les files 1-149 de la taula `slots` (FM) ni al seu `slots.json`.
- Cap canvi al roster, al login per DNI, ni a les RPCs SQL existents.
- Cap redisseny visual: es replica el format FM.
- Exports PDF/Excel de Gatzara (es faran més endavant si calen).

## Arquitectura (enfocament aprovat)

Mateixa app i mateixa BD. Els slots Gatzara ocupen el rang d'IDs **201-251**
(FM acaba a 149; es deixa marge). La separació d'esdeveniments viu al metadata
del bundle (`slots.json` + `types.ts`), no a la BD.

### Rutes

| Ruta | Contingut |
|---|---|
| `/` | Selector: logo + 2 targetes (FM · Prèvia, Festa Major i Frigofiesta / Gatzara · 16-17 juliol) |
| `/fm` | La pàgina actual (NameGate + graelles FM i Frigofiesta) |
| `/gatzara` | Rèplica amb graelles «Barra» i «Cuina i pista» |

Login compartit (mateixa clau `localStorage`): t'identifiques un cop i serveix
per a tots dos esdeveniments. Botó de tornada al selector a cada pàgina.

### Model de dades

- `SlotMeta` guanya: `event?: "fm" | "gatzara"` (absent ⇒ `"fm"`), `num?: number`
  (número mostrat a la UI: 1-51 per Gatzara; si absent es mostra `id`), i `tag`
  passa de `"Muntatge" | "Desmuntatge" | null` a `string | null` (rols de cuina).
- `slots.json`: s'hi AFEGEIXEN 51 entrades (`id` 201-251, `num` 1-51,
  `event: "gatzara"`, `table: "GATZARA_BARRA" | "GATZARA_CUINA"`). Les entrades FM
  no es modifiquen.
- BD: `INSERT` idempotent de 51 files a `public.slots` (ids 201-251), fitxer nou
  `supabase/gatzara.sql` (amb `on conflict (id) do nothing`). Les RPCs
  `claim_slot`/`release_slot`/`my_slots` funcionen sense canvis (van per id;
  `franja_key = block|time_label` no col·lideix perquè els blocs Gatzara tenen
  noms propis).

### Graelles Gatzara (dades del full, colors re-verificats 2026-07-09)

**GATZARA_BARRA** (cols N,O,P = BARMANS ×3 · Q = CAP BARRA · R,S = COBRANT ×2):

| Bloc | Franja | Slots (num → color) | Tag |
|---|---|---|---|
| Gatzara dijous 16/07 | 19:00 | 1-6 blanc | Muntatge |
| Gatzara divendres 17/07 | 11:00 | 7-12 blanc | Muntatge |
| Gatzara divendres 17/07 | 19:00-20:30 | 13 verd, 14 verd, 15 vermell, 16 roig, 17 verd, 18 verd | — |
| Gatzara divendres 17/07 | 20:30-22:00 | 19 verd, 20 verd, 21 vermell, 22 roig, 23 verd, 24 vermell | — |
| Gatzara divendres 17/07 | 22:00-23:30 | 25 verd, 26 verd, 27 vermell, 28 roig, 29 verd, 30 vermell | — |
| Gatzara divendres 17/07 | 23:30-1:00 | 31 verd, 32 vermell, 33 vermell, 34 roig, 35 vermell, 36 vermell | — |
| Gatzara divendres 17/07 | 1:00-2:30 | 37 verd, 38 vermell, 39 vermell, 40 roig, 41 vermell, 42 vermell | — |

**GATZARA_CUINA** (tot al bloc «Gatzara divendres 17/07»; el rol es mostra com a
tag de la fila perquè una mateixa hora té rols diferents):

| Franja | Rol (tag) | Slots (num → color) |
|---|---|---|
| 18:00-20:00 | MUNTAR/SERVIR | 46 verd, 47 verd |
| 18:00-22:00 | CAP CUINA | 45 roig |
| 18:00-0:00 | CAP PISTA | 51 vermell |
| 20:00-22:00 | PATATERO | 43 verd |
| 20:00-22:00 | CUINA | 44 vermell |
| 20:00-22:00 | MUNTAR/SERVIR | 48 vermell, 49 vermell |
| 22:00-0:00 | PATATERO | 50 verd |

Les fusions del full (45 = P12:P13, 51 = S12:S14) es tradueixen a franges
pròpies (18:00-22:00 i 18:00-0:00): cada slot té una única `time_label`.
Les caselles grises del full no existeixen com a slot.

### Canvis de codi

- `grid.ts`: la clau de fila passa de `block|time` a `block|time|tag` (a FM no
  canvia res: totes les files FM tenen tag homogeni). Constants de columnes per
  a les dues graelles Gatzara.
- `useSlots(event)`: filtra `SLOTS_META` per esdeveniment; realtime i claim/release
  intactes (per id).
- `page.tsx` actual es refactoritza en un component compartit `EventPage`
  parametritzat per esdeveniment (títol, graelles, llindars de medalla, enllaç
  del programa només a FM). `/fm` i `/gatzara` en són instàncies; `/` és el selector.
- `SlotCell`: mostra `num ?? id`.
- **Medalles per esdeveniment**: es compten només els slots propis de
  l'esdeveniment actiu (`mineIds ∩ ids de l'esdeveniment`). Llindars:
  FM bronze/plata/or = 1/3/5 (com ara) · **Gatzara = 1/2/3**.
- **StatsBar per esdeveniment**: ja surt de `computeStats(slots de la pàgina)` —
  amb el filtre per event queda individual per esdeveniment.

### Errors i concurrència

Idèntic a FM (ja resolt per les RPCs): carreres de claim → "taken", duplicat de
franja → "dup", alliberar només el propi per DNI. Cap cas nou.

### Proves

- Unit (vitest): `buildGrid` separa files amb mateixa hora i tag diferent;
  `computeStats` només compta l'esdeveniment filtrat; mapping medalles Gatzara 1/2/3.
- Manual: selector → /fm intacte (dades reals intactes); /gatzara mostra 51 places
  amb números 1-51, colors del full i tags de rol; apuntar-se/alliberar; % separat.

### Desplegament

1. Executar `supabase/gatzara.sql` a l'SQL Editor (INSERT idempotent, no toca FM).
2. `git push` → Vercel desplega.
