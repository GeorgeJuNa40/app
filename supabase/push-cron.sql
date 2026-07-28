-- ============================================================================
-- Move yA — Programador de recordatorios push (pg_cron + pg_net)
-- ----------------------------------------------------------------------------
-- Hace que Supabase llame sola a la función 'notify-reminders' cada 30 minutos,
-- para enviar los recordatorios de clases (24 h antes) y de paquetes por vencer.
--
-- PASOS:
--   1) Reemplaza  TU_PROJECT_REF  por el ref de tu proyecto (lo ves en la URL
--      del panel: https://supabase.com/dashboard/project/TU_PROJECT_REF).
--   2) Reemplaza  TU_ANON_KEY     por tu llave "anon public"
--      (Settings → API → Project API keys → anon public).
--   3) Ejecuta este archivo UNA VEZ en el SQL Editor.
--
-- Nota: la función 'notify-reminders' debe estar publicada con "Enforce JWT"
-- DESACTIVADO (la invoca el cron, no un usuario).
-- ============================================================================

-- Extensiones necesarias (seguras de re-ejecutar).
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Evita duplicar el trabajo si ya existía.
select cron.unschedule('moveya-notify-reminders')
where exists (select 1 from cron.job where jobname = 'moveya-notify-reminders');

-- Cada 30 minutos: llama a la función notify-reminders.
select cron.schedule(
  'moveya-notify-reminders',
  '*/30 * * * *',
  $$
  select net.http_post(
    url     := 'https://TU_PROJECT_REF.supabase.co/functions/v1/notify-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer TU_ANON_KEY',
      'apikey', 'TU_ANON_KEY'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- Para ver los trabajos programados:   select * from cron.job;
-- Para quitar este trabajo:            select cron.unschedule('moveya-notify-reminders');
