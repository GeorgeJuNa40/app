-- ============================================================================
-- Move yA — Clases fijas semanales (horario que no se borra) + reseteo de reservas
-- ----------------------------------------------------------------------------
-- Las clases marcadas como "fijas" (recurring = true) son un HORARIO SEMANAL:
-- no se borran. Cada día, al pasar la medianoche, este job limpia las reservas
-- de las clases cuyo día ya pasó y recorre la clase a la MISMA hora la semana
-- siguiente. Así el lunes 12:00 sigue existiendo para reservar el próximo lunes,
-- pero sin arrastrar las reservas de la semana anterior.
--
-- Requiere pg_cron + pg_net (ya instalados si corriste push-cron.sql).
-- Cómo usarlo: Supabase → SQL Editor → pega TODO → Run. Seguro re-ejecutarlo.
-- ============================================================================

-- 1) Columna: marca si la clase es fija (semanal). Por defecto sí.
alter table public.class_sessions
  add column if not exists recurring boolean not null default true;

-- 2) Reseteo: limpia reservas de clases fijas cuyo día ya pasó y las recorre
--    +N semanas para que caigan hoy o en el futuro (conserva día y hora).
create or replace function public.roll_recurring_sessions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  tz text := 'America/Monterrey';   -- zona de referencia (ajústala si tu estudio está en otra)
  v_count int := 0;
begin
  with due as (
    select
      id,
      ceil(
        (timezone(tz, now())::date - timezone(tz, starts_at)::date) / 7.0
      )::int as weeks
    from public.class_sessions
    where recurring = true
      and timezone(tz, starts_at)::date < timezone(tz, now())::date
  ),
  -- Limpia las reservas de esas clases (se reabren para la próxima semana).
  cleaned as (
    delete from public.bookings b using due where b.session_id = due.id returning 1
  )
  update public.class_sessions s
     set starts_at = s.starts_at + (due.weeks * interval '7 days'),
         ends_at   = s.ends_at   + (due.weeks * interval '7 days')
    from due
   where s.id = due.id;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.roll_recurring_sessions() to authenticated;

-- 3) Job diario ~00:05 hora Monterrey (06:05 UTC). Limpia y recorre las clases.
select cron.unschedule('moveya-roll-classes')
where exists (select 1 from cron.job where jobname = 'moveya-roll-classes');

select cron.schedule(
  'moveya-roll-classes',
  '5 6 * * *',
  $$ select public.roll_recurring_sessions(); $$
);

-- Verifica el reseteo manual (opcional):  select public.roll_recurring_sessions();
-- Devuelve cuántas clases se recorrieron.
-- ============================================================================
