-- ============================================================================
-- Move yA — Clases fijas semanales (horario que no se borra) + reseteo de reservas
-- ----------------------------------------------------------------------------
-- Las clases marcadas como "fijas" (recurring = true) son un HORARIO SEMANAL.
-- Cada día, al pasar la medianoche, este job "reabre" cada clase cuyo día ya
-- pasó: crea la ocurrencia de la PRÓXIMA SEMANA (misma hora/coach/cupo, sin
-- reservas) y marca la ocurrencia pasada como HISTÓRICA (recurring = false),
-- CONSERVANDO sus reservas y asistencias. Así:
--   • El cupo del próximo lunes queda libre para reservar (reserva reiniciada).
--   • Los Reportes y las metas de varias semanas conservan el historial real
--     (antes se borraba y se perdía la asistencia).
--
-- Requiere pg_cron (ya instalado si corriste push-cron.sql).
-- Cómo usarlo: Supabase → SQL Editor → pega TODO → Run. Seguro re-ejecutarlo.
-- ============================================================================

-- 1) Columna: marca si la clase es fija (semanal). Por defecto sí.
alter table public.class_sessions
  add column if not exists recurring boolean not null default true;

-- 2) Reseteo: por cada clase fija cuyo día ya pasó, crea la ocurrencia de la
--    próxima semana (limpia, sin reservas) y archiva la pasada conservando su
--    historial. Devuelve cuántas clases se reabrieron.
create or replace function public.roll_recurring_sessions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  tz text := 'America/Monterrey';   -- zona de referencia (ajústala si aplica)
  v_count int := 0;
begin
  with due as (
    -- Clases fijas cuyo día (en hora local) ya pasó, con cuántas semanas
    -- avanzar para caer en la próxima ocurrencia futura (conserva día y hora).
    select
      id, studio_id, template_id, coach_id, starts_at, ends_at, capacity,
      ceil((timezone(tz, now())::date - timezone(tz, starts_at)::date) / 7.0)::int as weeks
    from public.class_sessions
    where recurring = true
      and timezone(tz, starts_at)::date < timezone(tz, now())::date
  ),
  ins as (
    -- Crea la ocurrencia de la próxima semana (nueva, sin reservas, sigue fija).
    insert into public.class_sessions
      (id, studio_id, template_id, coach_id, starts_at, ends_at, capacity, recurring)
    select
      gen_random_uuid()::text, studio_id, template_id, coach_id,
      starts_at + (weeks * interval '7 days'),
      ends_at   + (weeks * interval '7 days'),
      capacity, true
    from due
    returning 1
  )
  -- Archiva la ocurrencia pasada: deja de ser fija y CONSERVA sus reservas y
  -- asistencias (para Reportes y metas). Ya no aparece en el calendario (pasó).
  update public.class_sessions s
     set recurring = false
    from due
   where s.id = due.id;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.roll_recurring_sessions() to authenticated;

-- 3) Job diario ~00:05 hora Monterrey (06:05 UTC).
select cron.unschedule('moveya-roll-classes')
where exists (select 1 from cron.job where jobname = 'moveya-roll-classes');

select cron.schedule(
  'moveya-roll-classes',
  '5 6 * * *',
  $$ select public.roll_recurring_sessions(); $$
);

-- Verifica manualmente (opcional):  select public.roll_recurring_sessions();
-- Devuelve cuántas clases se reabrieron para la siguiente semana.
-- ============================================================================
