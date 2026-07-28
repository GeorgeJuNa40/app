-- ============================================================================
-- NOTIFICACIONES PUSH (Web Push) — tabla de suscripciones + permisos (RLS)
-- ----------------------------------------------------------------------------
-- Ejecuta este archivo UNA VEZ en Supabase (SQL Editor). Guarda la "suscripción"
-- del navegador de cada usuario para poder enviarle avisos aunque la app esté
-- cerrada. Es seguro volver a ejecutarlo (usa IF NOT EXISTS / OR REPLACE).
-- ============================================================================

create table if not exists push_subscriptions (
  id          text primary key default gen_random_uuid()::text,
  user_id     text not null references users(id) on delete cascade,
  studio_id   text not null references studios(id) on delete cascade,
  endpoint    text not null unique,   -- identifica al navegador; evita duplicados
  p256dh      text not null,          -- llave pública del navegador
  auth        text not null,          -- secreto del navegador
  created_at  timestamptz not null default now()
);
create index if not exists idx_push_subs_user on push_subscriptions (user_id);
create index if not exists idx_push_subs_studio on push_subscriptions (studio_id);

-- Seguridad por fila: cada quien administra SUS propias suscripciones.
alter table push_subscriptions enable row level security;

drop policy if exists push_subs_select on push_subscriptions;
create policy push_subs_select on push_subscriptions
  for select using (user_id = auth.uid()::text);

drop policy if exists push_subs_insert on push_subscriptions;
create policy push_subs_insert on push_subscriptions
  for insert with check (user_id = auth.uid()::text);

drop policy if exists push_subs_update on push_subscriptions;
create policy push_subs_update on push_subscriptions
  for update using (user_id = auth.uid()::text);

drop policy if exists push_subs_delete on push_subscriptions;
create policy push_subs_delete on push_subscriptions
  for delete using (user_id = auth.uid()::text);

-- Registro de avisos ya enviados, para no repetir el mismo recordatorio.
-- 'kind' identifica el tipo (ej. 'class-24h:<sessionId>' o 'pkg-expiring:<userPkgId>').
create table if not exists push_sent_log (
  id         text primary key default gen_random_uuid()::text,
  user_id    text not null references users(id) on delete cascade,
  kind       text not null,
  sent_at    timestamptz not null default now(),
  unique (user_id, kind)
);
