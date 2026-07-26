-- ============================================================================
-- Move yA — Preparación de la base para Stripe (pasarela de pagos, M1)
-- ----------------------------------------------------------------------------
-- Agrega la columna que usa el webhook para NO duplicar un pago si Stripe
-- reenvía el mismo evento (idempotencia).
--
-- Cómo usarlo: Supabase → SQL Editor → New query → pega esto → Run.
-- Es seguro correrlo más de una vez.
-- ============================================================================

alter table public.payments
  add column if not exists stripe_session_id text;

-- Búsqueda rápida por sesión de Stripe (para la verificación de idempotencia).
create unique index if not exists idx_payments_stripe_session
  on public.payments (stripe_session_id)
  where stripe_session_id is not null;

-- ============================================================================
-- LISTO. Verifica que la columna existe:
--   select column_name from information_schema.columns
--   where table_name = 'payments' and column_name = 'stripe_session_id';
-- ============================================================================
