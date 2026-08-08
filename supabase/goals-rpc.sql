-- ============================================================================
-- Move yA — Metas del alumno: avance por asistencia + estrellas automáticas
-- ----------------------------------------------------------------------------
-- El ALUMNO crea sus propias metas ("asistir a X clases antes de [fecha]"). La
-- app calcula el avance contando sus asistencias dentro de la ventana de la meta.
-- Al cumplirla, esta función (segura) la marca como lograda y le da una cantidad
-- FIJA de estrellas configurada por el estudio (branding.goalStarReward, def 5).
--
-- Cómo usarlo: Supabase → SQL Editor → pega TODO → Run. Seguro correrlo de nuevo.
-- Requiere rls-policies.sql y harden-writes.sql (star_entries es solo-lectura
-- para el alumno; por eso las estrellas se dan por esta RPC).
-- ============================================================================

-- Fecha de creación de la meta (inicio de la ventana de conteo).
alter table public.goals add column if not exists created_at timestamptz not null default now();

create or replace function public.award_goal(p_goal_id text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     text := auth.uid()::text;
  v_owner   text;
  v_target  int;
  v_end     timestamptz;
  v_created timestamptz;
  v_ach     boolean;
  v_studio  text;
  v_reward  int;
  v_count   int;
  v_entry   text;
begin
  if v_uid is null then raise exception 'NOT_ALLOWED'; end if;

  select user_id, target_value, period_end, created_at, achieved
    into v_owner, v_target, v_end, v_created, v_ach
  from public.goals
  where id = p_goal_id
  for update;

  if v_owner is null then raise exception 'NOT_FOUND'; end if;
  if v_owner <> v_uid then raise exception 'NOT_ALLOWED'; end if;

  -- Progreso: clases ASISTIDAS del alumno dentro de la ventana de la meta.
  select count(*) into v_count
  from public.bookings b
  join public.class_sessions s on s.id = b.session_id
  where b.user_id = v_uid
    and b.status = 'ATTENDED'
    and s.starts_at >= v_created
    and s.starts_at <= v_end;

  -- Si ya estaba lograda, solo sincroniza el avance y no repite estrellas.
  if v_ach then
    return json_build_object('achieved', true, 'already', true, 'progress', v_count, 'stars', 0);
  end if;

  -- Aún no cumple: guarda el avance y termina.
  if v_count < coalesce(v_target, 0) then
    update public.goals set current_value = v_count where id = p_goal_id;
    return json_build_object('achieved', false, 'progress', v_count, 'stars', 0);
  end if;

  -- ¡Cumplió! Estrellas configuradas por el estudio (default 5).
  select studio_id into v_studio from public.users where id = v_uid;
  select coalesce(nullif(branding->>'goalStarReward','')::int, 5) into v_reward
  from public.studios where id = v_studio;
  if v_reward is null then v_reward := 5; end if;

  update public.goals set achieved = true, current_value = v_count where id = p_goal_id;

  if v_reward > 0 then
    v_entry := gen_random_uuid()::text;
    insert into public.star_entries (id, user_id, delta, reason)
      values (v_entry, v_uid, v_reward, 'bonus');
  end if;

  return json_build_object('achieved', true, 'progress', v_count, 'stars', v_reward);
end;
$$;
grant execute on function public.award_goal(text) to authenticated;

-- ============================================================================
-- LISTO. Verifica:  select proname from pg_proc where proname = 'award_goal';
-- ============================================================================
