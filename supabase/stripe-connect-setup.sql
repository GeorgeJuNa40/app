-- ============================================================================
-- Move yA — Stripe Connect (cada estudio recibe sus pagos en su cuenta)
-- ----------------------------------------------------------------------------
-- Agrega a la tabla studios las columnas para guardar la cuenta Connect (Express)
-- de cada estudio y si ya puede recibir cobros.
--
-- Cómo usarlo: Supabase → SQL Editor → pega TODO → Run. Debe decir "Success".
-- Es seguro correrlo de nuevo.
-- ============================================================================

alter table public.studios add column if not exists stripe_account_id text;
alter table public.studios add column if not exists stripe_charges_enabled boolean not null default false;
