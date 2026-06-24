-- FIX: ownership/edit strictly by ID (DNI), never by name.
-- Run ONCE in the Supabase SQL Editor (after the previous SQL files).

-- Returns the slot ids owned by a given ID (so the client can mark "mine" by DNI).
create or replace function public.my_slots(p_external_id text)
returns setof int
language sql
security definer
set search_path = public
as $$
  select slot_id from public.slot_owner where person_id = p_external_id;
$$;
grant execute on function public.my_slots(text) to anon, authenticated;

-- Release now requires that the caller's ID owns the slot (not the name).
create or replace function public.release_slot(p_id int, p_person text, p_external_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated int;
begin
  -- Only the owner (by ID) may release.
  if p_external_id is null or not exists (
       select 1 from public.slot_owner
       where slot_id = p_id and person_id = p_external_id
     ) then
    return false;
  end if;

  update public.slots
     set taken_by = null, taken_at = null
   where id = p_id;
  get diagnostics updated = row_count;

  if updated = 1 then
    delete from public.slot_owner where slot_id = p_id;
    insert into public.slot_events (slot_id, person, person_id, action)
      values (p_id, trim(p_person), p_external_id, 'release');
  end if;
  return updated = 1;
end;
$$;
grant execute on function public.release_slot(int, text, text) to anon, authenticated;
