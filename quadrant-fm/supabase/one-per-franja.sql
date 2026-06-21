-- ONE SLOT PER PERSON PER FRANJA (dia + hora)
-- Run ONCE in the Supabase SQL Editor (after schema.sql, history.sql, identity.sql).
-- Identifies the person by their access ID (DNI), never by name (names repeat).

-- Server-only ownership table: who (by ID) holds which slot, and in which franja.
create table if not exists public.slot_owner (
  slot_id    int primary key,
  person_id  text not null,
  franja_key text not null
);
-- A person can hold at most one slot per franja (backstop against races).
create unique index if not exists slot_owner_person_franja_idx
  on public.slot_owner (person_id, franja_key);

alter table public.slot_owner enable row level security;
-- No policies: only SECURITY DEFINER functions and the service role touch it.

-- Backfill currently-taken slots (best effort, by the latest claim's ID).
insert into public.slot_owner (slot_id, person_id, franja_key)
select s.id, e.person_id, s.block || '|' || s.time_label
from public.slots s
join lateral (
  select person_id from public.slot_events e2
  where e2.slot_id = s.id and e2.action = 'claim' and e2.person_id is not null
  order by e2.created_at desc limit 1
) e on true
where s.taken_by is not null
on conflict do nothing;

-- Claim now returns a status: 'ok' | 'taken' (lost race) | 'dup' (already has one in this franja) | 'error'
drop function if exists public.claim_slot(int, text, text);
create function public.claim_slot(p_id int, p_person text, p_external_id text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_block text;
  v_time  text;
  v_key   text;
  updated int;
begin
  if p_person is null or length(trim(p_person)) = 0 then
    return 'error';
  end if;

  select block, time_label into v_block, v_time from public.slots where id = p_id;
  if v_block is null then
    return 'error';
  end if;
  v_key := v_block || '|' || v_time;

  -- Same person (by ID) already has a slot in this franja?
  if p_external_id is not null and exists (
       select 1 from public.slot_owner
       where person_id = p_external_id and franja_key = v_key
     ) then
    return 'dup';
  end if;

  update public.slots
     set taken_by = trim(p_person), taken_at = now()
   where id = p_id and taken_by is null;
  get diagnostics updated = row_count;
  if updated <> 1 then
    return 'taken';
  end if;

  insert into public.slot_owner (slot_id, person_id, franja_key)
    values (p_id, coalesce(p_external_id, ''), v_key)
    on conflict (slot_id) do update
      set person_id = excluded.person_id, franja_key = excluded.franja_key;

  insert into public.slot_events (slot_id, person, person_id, action)
    values (p_id, trim(p_person), p_external_id, 'claim');

  return 'ok';
end;
$$;

-- Release also frees the ownership record.
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
    delete from public.slot_owner where slot_id = p_id;
    insert into public.slot_events (slot_id, person, person_id, action)
      values (p_id, trim(p_person), p_external_id, 'release');
  end if;
  return updated = 1;
end;
$$;

grant execute on function public.claim_slot(int, text, text) to anon, authenticated;
grant execute on function public.release_slot(int, text, text) to anon, authenticated;
