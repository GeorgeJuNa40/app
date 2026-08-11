-- ============================================================================
-- Move yA — Penalización por no asistir (adeudo)
-- ----------------------------------------------------------------------------
-- Guarda en cada reserva el adeudo generado cuando el alumno NO asiste sin
-- cancelar. El monto lo define el estudio (branding.noShowPenaltyUsd). El
-- estudio ve y cobra/condona el adeudo desde Miembros; el alumno lo ve en
-- "Mis Paquetes". No cambia las reservas ni los pagos existentes.
--
-- Cómo usarlo: Supabase → SQL Editor → pega TODO → Run. Seguro re-ejecutarlo.
-- Las políticas RLS actuales ya permiten al estudio (staff) escribir en
-- bookings, así que no hace falta tocar permisos.
-- ============================================================================

alter table public.bookings
  add column if not exists penalty_usd numeric not null default 0;

alter table public.bookings
  add column if not exists penalty_paid boolean not null default false;

-- Verifica:  select id, status, penalty_usd, penalty_paid from public.bookings limit 5;
-- ============================================================================
