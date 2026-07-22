-- ============================================================================
-- Move yA — Esquema de Base de Datos para Supabase (Etapa 1, Paso 2)
-- ----------------------------------------------------------------------------
-- Este archivo crea las 11 tablas ("cajones") de la app, tal como las usa hoy.
-- Cómo usarlo:
--   1. Abre tu proyecto en Supabase.
--   2. Menú izquierdo -> "SQL Editor" -> "New query".
--   3. Copia TODO este archivo, pégalo y presiona "Run".
--
-- Nota: aquí NO se activa aún la seguridad por estudio (RLS). Eso es el Paso 5.
-- No expongas datos reales de clientes hasta completar ese paso.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 0. Etiquetas fijas (ENUMS): valores permitidos para ciertos campos.
--    Evitan errores de dedo (ej. escribir "estudiante" en vez de "STUDENT").
-- ----------------------------------------------------------------------------
create type role            as enum ('STUDIO_ADMIN', 'COACH', 'STUDENT');
create type booking_status  as enum ('RESERVED', 'ATTENDED', 'CANCELED', 'NO_SHOW');
create type coach_status    as enum ('APPROVED', 'PENDING', 'DENIED');
create type payment_method  as enum ('cash', 'card', 'transfer', 'paypal');


-- ----------------------------------------------------------------------------
-- 1. ESTUDIOS  (tus clientes) — el dueño de todo.
--    Los datos de configuración (branding, servicios, whatsapp, suscripción)
--    se guardan como "bloques" JSON porque la app los maneja como un solo
--    objeto editable. Las fotos son una lista de imágenes.
-- ----------------------------------------------------------------------------
create table studios (
  id            text primary key default gen_random_uuid()::text,
  name          text not null,
  ceu_code      text not null unique,           -- Código de Estudio Único (onboarding)
  phone         text default '',
  email         text default '',
  address       text default '',
  photos        jsonb not null default '[]',    -- galería del estudio
  branding      jsonb not null default '{}',    -- colores, tipografía, logoText, logoUrl
  services      jsonb not null default '[]',    -- servicios opcionales (Nutrición, etc.)
  whatsapp      jsonb not null default '{}',    -- número, bot, plantillas, conocimiento
  subscription  jsonb not null default '{}',    -- estado, precios de promo, fechas
  created_at    timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
-- 2. USUARIOS  (admins, coaches y alumnos) — cada uno pertenece a un estudio.
--    Los campos "coach_*" solo se llenan cuando el usuario es COACH.
-- ----------------------------------------------------------------------------
create table users (
  id                text primary key default gen_random_uuid()::text,
  studio_id         text not null references studios(id) on delete cascade,
  role              role not null,
  full_name         text not null,
  email             text not null,
  phone             text default '',
  avatar_initials   text default '',
  avatar_url        text,                        -- foto de perfil (archivo subido)
  coach_bio         text,
  coach_specialties jsonb default '[]',
  coach_years_exp   integer,
  coach_status      coach_status,                -- solo coaches: aprobar/denegar
  created_at        timestamptz not null default now(),
  unique (studio_id, email)                      -- un correo único por estudio
);
create index idx_users_studio_role on users (studio_id, role);


-- ----------------------------------------------------------------------------
-- 3. PAQUETES  (los que vende el estudio).
--    eligible_class_ids = lista de tipos de clase que cubre el paquete.
-- ----------------------------------------------------------------------------
create table packages (
  id                 text primary key default gen_random_uuid()::text,
  studio_id          text not null references studios(id) on delete cascade,
  name               text not null,
  description        text default '',
  price_usd          numeric(10,2) not null default 0,
  class_credits      integer not null default 0,
  validity_days      integer not null default 30,
  active             boolean not null default true,
  eligible_class_ids jsonb not null default '[]',
  created_at         timestamptz not null default now()
);
create index idx_packages_studio on packages (studio_id);


-- ----------------------------------------------------------------------------
-- 4. PAQUETES_ALUMNO  (el paquete que compró cada alumno + clases restantes).
-- ----------------------------------------------------------------------------
create table user_packages (
  id             text primary key default gen_random_uuid()::text,
  user_id        text not null references users(id) on delete cascade,
  package_id     text not null references packages(id),
  credits_total  integer not null,
  credits_used   integer not null default 0,
  purchased_at   timestamptz not null default now(),
  expires_at     timestamptz not null,
  active         boolean not null default true
);
create index idx_user_packages_user on user_packages (user_id, active);


-- ----------------------------------------------------------------------------
-- 5. TIPOS_CLASE  (Reformer, Mat, etc.) — con su foto y color.
-- ----------------------------------------------------------------------------
create table class_templates (
  id           text primary key default gen_random_uuid()::text,
  studio_id    text not null references studios(id) on delete cascade,
  name         text not null,
  duration_min integer not null default 50,
  color_hex    text not null default '#2D5A4C',
  photo_url    text                              -- foto que define el tipo de clase
);
create index idx_class_templates_studio on class_templates (studio_id);


-- ----------------------------------------------------------------------------
-- 6. SESIONES  (cada clase agendada en el calendario).
--    coach_id puede quedar vacío (sin coach asignado todavía).
-- ----------------------------------------------------------------------------
create table class_sessions (
  id           text primary key default gen_random_uuid()::text,
  studio_id    text not null references studios(id) on delete cascade,
  template_id  text not null references class_templates(id),
  coach_id     text references users(id) on delete set null,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  capacity     integer not null default 10       -- para "Quedan X lugares"
);
create index idx_class_sessions_studio_start on class_sessions (studio_id, starts_at);


-- ----------------------------------------------------------------------------
-- 7. RESERVAS  (unen alumno + sesión + el paquete usado).
--    Un alumno no puede reservar dos veces la misma sesión.
-- ----------------------------------------------------------------------------
create table bookings (
  id              text primary key default gen_random_uuid()::text,
  user_id         text not null references users(id) on delete cascade,
  session_id      text not null references class_sessions(id) on delete cascade,
  user_package_id text references user_packages(id),
  status          booking_status not null default 'RESERVED',
  created_at      timestamptz not null default now(),
  unique (user_id, session_id)
);
create index idx_bookings_session on bookings (session_id);


-- ----------------------------------------------------------------------------
-- 8. PAGOS  (de los alumnos: efectivo o tarjeta).
--    registered_by = 'studio' (manual) u 'online' (pasarela).
-- ----------------------------------------------------------------------------
create table payments (
  id            text primary key default gen_random_uuid()::text,
  user_id       text not null references users(id) on delete cascade,
  amount_usd    numeric(10,2) not null,
  method        payment_method not null,
  package_id    text references packages(id),
  concept       text default '',
  paid_at       timestamptz not null default now(),
  registered_by text not null default 'studio'
);
create index idx_payments_user on payments (user_id);


-- ----------------------------------------------------------------------------
-- 9. ESTRELLAS  (gamificación: +suma por asistencia, -resta por canje).
-- ----------------------------------------------------------------------------
create table star_entries (
  id         text primary key default gen_random_uuid()::text,
  user_id    text not null references users(id) on delete cascade,
  delta      integer not null,
  reason     text not null default 'attendance',  -- attendance | redemption | bonus
  created_at timestamptz not null default now()
);
create index idx_star_entries_user on star_entries (user_id);


-- ----------------------------------------------------------------------------
-- 10. RECOMPENSAS  (el catálogo de premios que define el estudio).
-- ----------------------------------------------------------------------------
create table rewards (
  id          text primary key default gen_random_uuid()::text,
  studio_id   text not null references studios(id) on delete cascade,
  name        text not null,
  description text default '',
  star_cost   integer not null default 0,
  active      boolean not null default true
);
create index idx_rewards_studio on rewards (studio_id);


-- ----------------------------------------------------------------------------
-- 11. METAS  (los objetivos personales del alumno).
-- ----------------------------------------------------------------------------
create table goals (
  id            text primary key default gen_random_uuid()::text,
  user_id       text not null references users(id) on delete cascade,
  title         text not null,
  target_value  integer not null default 0,
  current_value integer not null default 0,
  period_end    timestamptz not null,
  achieved      boolean not null default false
);
create index idx_goals_user on goals (user_id);


-- ============================================================================
-- LISTO. Verifica al final corriendo esta consulta: debe listar 11 tablas.
--   select table_name from information_schema.tables
--   where table_schema = 'public' order by table_name;
-- ============================================================================
