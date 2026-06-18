# Quadrant FM 2026 — Web de torns col·laboratius

**Data:** 2026-06-18
**Estat:** Disseny aprovat (pendent de revisió de l'spec)

## Objectiu

Replicar el quadre de l'Excel `quadrant-fm-26.xlsx` en una web molt visual on ~50 persones
puguin, alhora, apuntar-se a números/torns lliures durant la festa major. Quan algú ocupa un
número, queda bloquejat i visible per a tothom **a l'instant**. Inclou estadístiques de places
lliures i una llegenda de colors sempre visible.

## Origen de les dades (Excel)

Full únic "Prèvia i FM". Dues taules:

### Taula principal (FM) — 117 places
Columnes de l'Excel: B=HORARI, C–H=Barmans Públic, I–J=Barmans Colla, K=Cap Barra, L–M=Cobrant.
**Els títols de rol (fila 1) s'amaguen del tot**: a la web cada cel·la és només un número de color,
sense etiqueta de rol. Es conserva la posició de columna per reproduir els buits (cel·les grises =
no hi ha plaça).

Blocs i recompte:
| Bloc | Places |
|------|--------|
| Prèvia dissabte 27/06 (Muntatge 16:00 · 23:00-1:15 · 1:00-3:00 · Desmuntatge 03:00) | 22 |
| FM dijous 2/07 (Muntatge 16:00 · 22:30-00:15 · 00:00-2:15 · 2:00-4:00) | 31 |
| FM divendres 3/07 (22:30-00:15 · 00:00-2:15 · 2:00-4:00) | 29 |
| FM dissabte 4/07 (22:00-00:15 · 00:00-2:15 · 2:00-4:00 · Desmuntatge 04:00) | 35 |

Columna **N** de l'Excel ("Muntatge"/"Desmuntatge") es conserva com a etiqueta de la fila.

### Taula Frigofiesta (FRIGO) — 32 places
4 places per fila, blanques (qualsevol experiència). Dates/hores (8 files):
26/06 19:00 · 27/06 09:30 · 27/06 18:30 · 28/06 16:30 · 03/07 18:30 · 04/07 12:30 · 04/07 18:30 · 05/07 19:00.

### Llegenda de colors (experiència per plaça)
| Color | Hex Excel | Significat |
|-------|-----------|------------|
| 🟥 Roig | `E06666` | Persones veteranes per cap de barra |
| 🟧 Vermell | `F4CCCC` | Persones amb experiència (+7 barres) |
| 🟩 Verd | `D9EAD3` | Persones amb poca o gens experiència |
| ⬜ Blanc | — | Indiferent l'experiència que tinguis |

### Renumeració
A l'Excel els números 144 i 145 estaven encastats al mig de la Prèvia. Es renumera tot en
**ordre de lectura** (amunt→avall, esquerra→dreta), **continuat 1→149**: taula principal 1–117,
Frigofiesta 118–149. Sense repetits. El mapa exacte (amb color, bloc, horari, etiqueta, columna i
número original) es genera a `slots.json` i és la font del *seed* de la base de dades.

## Identitat visual (colla La Mama Ve)

- **Colors corporatius:** rosa (magenta intens, com el logo) i blanc. Fons clar amb accents rosa;
  capçalera/elements destacats en rosa, text i targetes en blanc. Negre per contorns/text fort.
- **Logo:** `lamamave.png` (bafarada rosa "La Mama Ve!") a la capçalera de la web.
- Els colors de la **llegenda** (roig/vermell/verd/blanc) es mantenen tal qual per a les places —
  no es barregen amb el rosa corporatiu, que s'usa per l'ambient (capçalera, botons, fons, accents).

## Decisions preses
- **Backend/realtime:** Supabase (Postgres + Realtime). **Hosting:** Vercel des de GitHub.
- **Identitat:** només nom (guardat al navegador). Cadascú pot alliberar només les seves places.
- **Rols:** amagats del tot (només número + color).
- **Admin:** panell senzill protegit per clau secreta (alliberar qualsevol plaça / buidar-ho tot).
- **Numeració:** continuada 1→149.

## Arquitectura

```
Navegador (Next.js, React)
  ├─ Pantalla d'entrada: escriu el teu nom → localStorage
  ├─ Graella FM + taula Frigofiesta + llegenda fixa + barra d'estadístiques
  └─ Supabase JS client
        ├─ SELECT slots (càrrega inicial)
        ├─ Realtime subscription (postgres_changes a taula slots)
        ├─ claim:   RPC/UPDATE slots SET taken_by=:nom WHERE id=:id AND taken_by IS NULL
        └─ release: UPDATE slots SET taken_by=NULL WHERE id=:id AND taken_by=:nom
Supabase (Postgres)
  └─ taula `slots` (sembrada des de slots.json)
```

### Model de dades — taula `slots`
| Camp | Tipus | Notes |
|------|-------|-------|
| id | int PK | 1–149 |
| table_name | text | 'FM' \| 'FRIGO' |
| block | text | nom del bloc (per agrupar i per estadístiques) |
| time_label | text | horari mostrat |
| color | text | 'roig'\|'vermell'\|'verd'\|'blanc' |
| tag | text null | 'Muntatge'\|'Desmuntatge'\|null |
| col_pos | text | lletra de columna original (layout) |
| row_order | int | ordre dins el bloc (layout) |
| taken_by | text null | nom de qui l'ocupa (null = lliure) |
| taken_at | timestamptz null | |

Tota la metadada és estàtica (sembrada un cop). Només muten `taken_by`/`taken_at`.

### Seguretat de concurrència
Ocupar és un `UPDATE ... WHERE id=:id AND taken_by IS NULL`. És atòmic a Postgres: davant un
empat entre dos clients, només un afecta una fila; l'altre rep 0 files i veu "ja ocupat". Impossible
doble reserva. RLS de Supabase: lectura pública; `UPDATE` només pot posar `taken_by` quan és NULL i
alliberar quan `taken_by` = el nom enviat (excepte admin).

*Limitació acceptada:* identitat només pel nom → algú podria escriure el nom d'un altre per
alliberar-li una plaça. Acceptable per a l'abast (eina de festa major). Es documenta.

## UI / UX
- **Entrada:** input "El teu nom" + botó Entrar. Es recorda al navegador; botó per canviar de nom.
- **Llegenda** sempre visible (capçalera fixa o lateral) amb els 4 colors i significats.
- **Estadístiques** (barra fixa): "X / 149 places lliures" global + mini-barra de progrés per bloc.
- **Graella FM:** per bloc, files de torn amb columna d'horari + cel·les de color. Buits grisos
  conservats. Etiqueta Muntatge/Desmuntatge per fila.
  - Plaça **lliure:** mostra el número amb el color de la llegenda; clicable.
  - Plaça **ocupada:** mostra el nom de qui l'ha agafat, bloquejada; si és teva, botó per alliberar.
- **Taula Frigofiesta** a sota, mateix patró (places blanques).
- **Realtime:** qualsevol canvi es reflecteix a tots els navegadors en <1s sense refrescar.
- **Mòbil:** disseny responsive; graella amb scroll horitzontal en pantalles petites (50 persones
  entraran majoritàriament des del mòbil).
- **Admin:** ruta `/admin?key=...` (clau a variable d'entorn) per alliberar qualsevol plaça i botó
  "buidar tot".

## Desplegament
- Repositori a GitHub → projecte Vercel connectat (push a `main` = desplegament automàtic).
- Projecte Supabase gratuït; URL i `anon key` com a variables d'entorn a Vercel.
  Clau d'admin com a variable d'entorn separada.
- Capacitat: el pla gratuït de Supabase aguanta de sobres 50 connexions realtime concurrents.

## Gestió d'errors
- Clic a plaça ja ocupada (cursa perduda): missatge "Aquest número ja l'ha agafat {nom}", refresc local.
- Pèrdua de connexió realtime: reconnexió automàtica del client Supabase + recàrrega de l'estat en tornar.
- Nom buit: no es deixa entrar.

## Proves
- Unitat: lògica de classificació de color, renumeració, agrupació per blocs, càlcul d'estadístiques.
- Integració: claim atòmic (dos claims simultanis → només un guanya); release només del propi nom.
- E2E (Playwright): entrar amb nom, ocupar plaça, veure-la bloquejada; segona pestanya veu el canvi.

## Fora d'abast (YAGNI)
- Comptes/contrasenyes reals, recuperació de sessió entre dispositius, notificacions push,
  historial de canvis, exportació. Es pot afegir més endavant si cal.
