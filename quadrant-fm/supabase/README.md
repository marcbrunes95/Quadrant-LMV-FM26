# Supabase setup

1. Create a free project at https://supabase.com.
2. Project Settings → API: copy `Project URL`, `anon` key, and `service_role` key.
3. SQL Editor → run `schema.sql`, then run `seed.sql`.
4. Database → Replication: enable Realtime for the `slots` table
   (or run: `alter publication supabase_realtime add table public.slots;`).
5. Put the keys in `.env.local` (see `.env.example`) and in Vercel project env vars.
