-- TARDEO FINAL D'ESTIU — places que cobreix una altra colla.
-- Executar UN cop al SQL Editor de Supabase. Idempotent.
-- No toca cap fila existent: FM i Gatzara queden amb blocked = false.

alter table public.slots
  add column if not exists blocked boolean not null default false;

-- claim_slot rebutja les places bloquejades abans de tocar res. Sense aquesta
-- comprovació la protecció seria només del navegador, i n'hi hauria prou amb
-- la consola per saltar-se-la.
create or replace function public.claim_slot(p_id int, p_person text, p_external_id text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_block   text;
  v_time    text;
  v_blocked boolean;
  v_key     text;
  updated   int;
begin
  if p_person is null or length(trim(p_person)) = 0 then
    return 'error';
  end if;

  select block, time_label, blocked
    into v_block, v_time, v_blocked
    from public.slots where id = p_id;
  if v_block is null then
    return 'error';
  end if;
  if v_blocked then
    return 'blocked';
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

grant execute on function public.claim_slot(int, text, text) to anon, authenticated;
