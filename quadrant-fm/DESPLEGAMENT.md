# Desplegament — Quadrant FM 2026 (La Mama Ve)

Tres passos manuals (necessiten els teus comptes). Triga ~20 min.

## Pas 1 — Supabase (base de dades + temps real)

1. Vés a https://supabase.com → **Start your project** → entra amb GitHub o email (pla **Free**).
2. **New project**: posa-li un nom (p. ex. `quadrant-fm`), una contrasenya de base de dades
   (guarda-la) i una regió propera (Frankfurt/EU). Espera 1-2 min que es creï.
3. Menú lateral **SQL Editor** → **New query** → enganxa tot el contingut de
   `quadrant-fm/supabase/schema.sql` → **Run**. Hauria de dir "Success".
4. Una altra **New query** → enganxa tot `quadrant-fm/supabase/seed.sql` → **Run**.
   (Insereix les 149 places.)
5. Activa el temps real: **New query** → executa aquesta línia → **Run**:
   ```sql
   alter publication supabase_realtime add table public.slots;
   ```
6. Apunta les claus: menú **Project Settings** (icona d'engranatge) → **API**:
   - **Project URL** → serà `NEXT_PUBLIC_SUPABASE_URL`
   - clau **anon / public** → serà `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - clau **service_role** (secreta!) → serà `SUPABASE_SERVICE_ROLE_KEY`

## Pas 2 — GitHub (pujar el codi)

El codi ja està committejat en local. Només falta crear el repo i pujar-lo.

Opció A (recomanada, des de la terminal del projecte `c:/Quadrant-motors-LMV`):
```bash
gh auth login        # només el primer cop, segueix les instruccions
gh repo create quadrant-fm --private --source=. --remote=origin --push
```

Opció B (manual): crea un repo buit a https://github.com/new (privat, sense README), i després:
```bash
git remote add origin https://github.com/EL_TEU_USUARI/quadrant-fm.git
git branch -M main
git push -u origin main
```

## Pas 3 — Vercel (publicar la web)

1. Vés a https://vercel.com → entra amb GitHub.
2. **Add New… → Project** → importa el repo `quadrant-fm`.
3. **MOLT IMPORTANT** — desplega **Root Directory** i posa-hi `quadrant-fm`
   (el codi viu en aquesta subcarpeta, no a l'arrel del repo).
4. Obre **Environment Variables** i afegeix aquestes 4 (per a *Production* i *Preview*):

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | la Project URL del Pas 1 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la clau anon del Pas 1 |
   | `SUPABASE_SERVICE_ROLE_KEY` | la clau service_role del Pas 1 |
   | `ADMIN_KEY` | una contrasenya que t'inventis (per entrar a `/admin`) |

5. **Deploy**. En 1-2 min tindràs l'URL pública (p. ex. `quadrant-fm.vercel.app`).
   Comparteix-la amb la colla.

A partir d'aquí, cada `git push` a `main` torna a desplegar automàticament.

## Provar que funciona
- Obre l'URL, escriu un nom, apunta't a un número → es posa rosa amb el teu nom.
- Obre la mateixa URL en un altre mòbil/navegador amb un altre nom → veuràs el número
  ja ocupat i bloquejat a l'instant.
- Per administrar: `EL_TEU_URL/admin`, posa l'`ADMIN_KEY`, i pots alliberar un número o buidar-ho tot.

## Desenvolupar en local (opcional)
Crea `quadrant-fm/.env.local` amb les 4 variables i executa:
```bash
cd quadrant-fm
npm run dev
```
Obre http://localhost:3000.
