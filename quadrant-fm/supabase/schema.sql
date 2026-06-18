-- Slots table: static metadata + dynamic taken_by/taken_at
create table if not exists public.slots (
  id          int primary key,
  table_name  text not null,
  block       text not null,
  time_label  text not null,
  tag         text,
  color       text not null,
  col_pos     text not null,
  taken_by    text,
  taken_at    timestamptz
);

alter table public.slots enable row level security;

-- Everyone may read.
drop policy if exists slots_read on public.slots;
create policy slots_read on public.slots for select using (true);

-- No direct writes from anon/auth; all writes go through RPCs / service role.

-- Atomic claim: only succeeds if currently free. Returns true on success.
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
  return updated = 1;
end;
$$;

-- Release: only the person who took it may free it.
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
  return updated = 1;
end;
$$;

grant execute on function public.claim_slot(int, text) to anon, authenticated;
grant execute on function public.release_slot(int, text) to anon, authenticated;
