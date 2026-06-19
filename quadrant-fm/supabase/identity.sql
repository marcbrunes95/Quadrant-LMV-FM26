-- IDENTITY BY ID (DNI/NIE)
-- Run this ONCE in the Supabase SQL Editor (after schema.sql + history.sql),
-- then run the private file supabase/_private/roster-data.sql to load the people.

-- Roster: maps an access ID to a (first) name. Kept private: only the server
-- (service role) reads it; never exposed to the browser.
create table if not exists public.roster (
  id   text not null,
  name text not null
);
create index if not exists roster_id_idx on public.roster (id);

alter table public.roster enable row level security;
-- No policies: anon/authenticated cannot read it. Only service role (login API) can.

-- Log the access ID alongside the name in the history.
alter table public.slot_events add column if not exists person_id text;

-- Recreate claim/release with an extra external-id argument that gets logged.
drop function if exists public.claim_slot(int, text);
drop function if exists public.release_slot(int, text);

create or replace function public.claim_slot(p_id int, p_person text, p_external_id text)
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
  if updated = 1 then
    insert into public.slot_events (slot_id, person, person_id, action)
    values (p_id, trim(p_person), p_external_id, 'claim');
  end if;
  return updated = 1;
end;
$$;

create or replace function public.release_slot(p_id int, p_person text, p_external_id text)
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
  if updated = 1 then
    insert into public.slot_events (slot_id, person, person_id, action)
    values (p_id, trim(p_person), p_external_id, 'release');
  end if;
  return updated = 1;
end;
$$;

grant execute on function public.claim_slot(int, text, text) to anon, authenticated;
grant execute on function public.release_slot(int, text, text) to anon, authenticated;
