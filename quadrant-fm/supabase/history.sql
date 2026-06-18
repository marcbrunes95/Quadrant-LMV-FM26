-- HISTORY / AUDIT LOG
-- Run this ONCE in the Supabase SQL Editor (after schema.sql + seed.sql).
-- Adds an events log and makes claim/release record every action.

create table if not exists public.slot_events (
  id         bigserial primary key,
  slot_id    int  not null,
  person     text not null,
  action     text not null check (action in ('claim', 'release')),
  created_at timestamptz not null default now()
);

alter table public.slot_events enable row level security;
-- No public policies: only the admin API (service role) reads this table,
-- and the SECURITY DEFINER functions below insert into it.

create index if not exists slot_events_created_idx
  on public.slot_events (created_at desc);

-- Claim now logs a 'claim' event when it succeeds.
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
  if updated = 1 then
    insert into public.slot_events (slot_id, person, action)
    values (p_id, trim(p_person), 'claim');
  end if;
  return updated = 1;
end;
$$;

-- Release now logs a 'release' event when it succeeds.
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
  if updated = 1 then
    insert into public.slot_events (slot_id, person, action)
    values (p_id, trim(p_person), 'release');
  end if;
  return updated = 1;
end;
$$;

grant execute on function public.claim_slot(int, text) to anon, authenticated;
grant execute on function public.release_slot(int, text) to anon, authenticated;
