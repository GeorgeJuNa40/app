-- ============================================================================
-- Move yA — El "Candado de Oro": Seguridad por Estudio (Etapa 1, Paso 5)
-- ----------------------------------------------------------------------------
-- Activa Row Level Security (RLS) en las 11 tablas y define las reglas para
-- que cada quien SOLO vea y toque lo que le corresponde:
--
--   * Un ALUMNO ve el catálogo de su estudio y SOLO sus propias reservas,
--     paquetes, estrellas y metas. Nunca las de otro alumno.
--   * Un COACH ve los datos de SU estudio (alumnos, clases, reservas).
--   * Un ADMIN gestiona todo lo de SU estudio, y nada de otro estudio.
--   * Nadie, jamás, ve datos de un estudio que no es el suyo.
--
-- Cómo usarlo:
--   1. Supabase -> "SQL Editor" -> "New query".
--   2. Borra lo que haya, pega TODO este archivo y presiona "Run".
--   3. Debe decir "Success". Es seguro correrlo más de una vez.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Funciones de ayuda: averiguan quién eres SIN provocar bucles.
--    (security definer = leen la tabla users saltándose las reglas, solo aquí)
-- ----------------------------------------------------------------------------
create or replace function public.auth_studio_id()
returns text language sql stable security definer set search_path = public as $$
  select studio_id from public.users where id = auth.uid()::text
$$;

create or replace function public.auth_role()
returns text language sql stable security definer set search_path = public as $$
  select role::text from public.users where id = auth.uid()::text
$$;

-- ¿El dueño de esta fila (uid) pertenece a MI mismo estudio?
create or replace function public.user_in_my_studio(uid text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users u
    where u.id = uid and u.studio_id = public.auth_studio_id()
  )
$$;


-- ----------------------------------------------------------------------------
-- 2. Encender el candado (RLS) en las 11 tablas.
--    A partir de aquí, sin una regla que lo permita, NADIE ve nada.
-- ----------------------------------------------------------------------------
alter table public.studios         enable row level security;
alter table public.users           enable row level security;
alter table public.packages        enable row level security;
alter table public.user_packages   enable row level security;
alter table public.class_templates enable row level security;
alter table public.class_sessions  enable row level security;
alter table public.bookings        enable row level security;
alter table public.payments        enable row level security;
alter table public.star_entries    enable row level security;
alter table public.rewards         enable row level security;
alter table public.goals           enable row level security;


-- ----------------------------------------------------------------------------
-- 3. ESTUDIOS: ves tu estudio; solo el admin lo edita.
-- ----------------------------------------------------------------------------
drop policy if exists studios_read  on public.studios;
drop policy if exists studios_admin on public.studios;
create policy studios_read on public.studios
  for select using (id = public.auth_studio_id());
create policy studios_admin on public.studios
  for update using (id = public.auth_studio_id() and public.auth_role() = 'STUDIO_ADMIN')
          with check (id = public.auth_studio_id() and public.auth_role() = 'STUDIO_ADMIN');


-- ----------------------------------------------------------------------------
-- 4. USUARIOS: ves a todos los de tu estudio; cada quien edita su propia ficha;
--    el admin da de alta / edita / borra a coaches y alumnos.
-- ----------------------------------------------------------------------------
drop policy if exists users_read   on public.users;
drop policy if exists users_insert on public.users;
drop policy if exists users_update on public.users;
drop policy if exists users_delete on public.users;
create policy users_read on public.users
  for select using (studio_id = public.auth_studio_id());
create policy users_insert on public.users
  for insert with check (studio_id = public.auth_studio_id() and public.auth_role() = 'STUDIO_ADMIN');
create policy users_update on public.users
  for update using (id = auth.uid()::text
                    or (studio_id = public.auth_studio_id() and public.auth_role() = 'STUDIO_ADMIN'))
          with check (id = auth.uid()::text
                    or (studio_id = public.auth_studio_id() and public.auth_role() = 'STUDIO_ADMIN'));
create policy users_delete on public.users
  for delete using (studio_id = public.auth_studio_id() and public.auth_role() = 'STUDIO_ADMIN');


-- ----------------------------------------------------------------------------
-- 5. CATÁLOGO DEL ESTUDIO (paquetes, tipos de clase, sesiones, recompensas):
--    todos en el estudio los VEN; solo el admin los crea / edita / borra.
-- ----------------------------------------------------------------------------
-- Paquetes
drop policy if exists packages_read  on public.packages;
drop policy if exists packages_admin on public.packages;
create policy packages_read on public.packages
  for select using (studio_id = public.auth_studio_id());
create policy packages_admin on public.packages
  for all using (studio_id = public.auth_studio_id() and public.auth_role() = 'STUDIO_ADMIN')
      with check (studio_id = public.auth_studio_id() and public.auth_role() = 'STUDIO_ADMIN');

-- Tipos de clase
drop policy if exists class_templates_read  on public.class_templates;
drop policy if exists class_templates_admin on public.class_templates;
create policy class_templates_read on public.class_templates
  for select using (studio_id = public.auth_studio_id());
create policy class_templates_admin on public.class_templates
  for all using (studio_id = public.auth_studio_id() and public.auth_role() = 'STUDIO_ADMIN')
      with check (studio_id = public.auth_studio_id() and public.auth_role() = 'STUDIO_ADMIN');

-- Sesiones (calendario)
drop policy if exists class_sessions_read  on public.class_sessions;
drop policy if exists class_sessions_admin on public.class_sessions;
create policy class_sessions_read on public.class_sessions
  for select using (studio_id = public.auth_studio_id());
create policy class_sessions_admin on public.class_sessions
  for all using (studio_id = public.auth_studio_id() and public.auth_role() = 'STUDIO_ADMIN')
      with check (studio_id = public.auth_studio_id() and public.auth_role() = 'STUDIO_ADMIN');

-- Recompensas
drop policy if exists rewards_read  on public.rewards;
drop policy if exists rewards_admin on public.rewards;
create policy rewards_read on public.rewards
  for select using (studio_id = public.auth_studio_id());
create policy rewards_admin on public.rewards
  for all using (studio_id = public.auth_studio_id() and public.auth_role() = 'STUDIO_ADMIN')
      with check (studio_id = public.auth_studio_id() and public.auth_role() = 'STUDIO_ADMIN');


-- ----------------------------------------------------------------------------
-- 6. DATOS PERSONALES (paquetes-alumno, reservas, pagos, estrellas, metas):
--    el ALUMNO ve/gestiona SOLO lo suyo; el personal (admin/coach) ve todo lo
--    de SU estudio. Un alumno NUNCA ve lo de otro alumno.
-- ----------------------------------------------------------------------------
-- Paquetes comprados por el alumno
drop policy if exists user_packages_access on public.user_packages;
create policy user_packages_access on public.user_packages
  for all using (user_id = auth.uid()::text
                 or (public.auth_role() in ('STUDIO_ADMIN','COACH') and public.user_in_my_studio(user_id)))
      with check (user_id = auth.uid()::text
                 or (public.auth_role() in ('STUDIO_ADMIN','COACH') and public.user_in_my_studio(user_id)));

-- Reservas
drop policy if exists bookings_access on public.bookings;
create policy bookings_access on public.bookings
  for all using (user_id = auth.uid()::text
                 or (public.auth_role() in ('STUDIO_ADMIN','COACH') and public.user_in_my_studio(user_id)))
      with check (user_id = auth.uid()::text
                 or (public.auth_role() in ('STUDIO_ADMIN','COACH') and public.user_in_my_studio(user_id)));

-- Pagos
drop policy if exists payments_access on public.payments;
create policy payments_access on public.payments
  for all using (user_id = auth.uid()::text
                 or (public.auth_role() in ('STUDIO_ADMIN','COACH') and public.user_in_my_studio(user_id)))
      with check (user_id = auth.uid()::text
                 or (public.auth_role() in ('STUDIO_ADMIN','COACH') and public.user_in_my_studio(user_id)));

-- Estrellas
drop policy if exists star_entries_access on public.star_entries;
create policy star_entries_access on public.star_entries
  for all using (user_id = auth.uid()::text
                 or (public.auth_role() in ('STUDIO_ADMIN','COACH') and public.user_in_my_studio(user_id)))
      with check (user_id = auth.uid()::text
                 or (public.auth_role() in ('STUDIO_ADMIN','COACH') and public.user_in_my_studio(user_id)));

-- Metas
drop policy if exists goals_access on public.goals;
create policy goals_access on public.goals
  for all using (user_id = auth.uid()::text
                 or (public.auth_role() in ('STUDIO_ADMIN','COACH') and public.user_in_my_studio(user_id)))
      with check (user_id = auth.uid()::text
                 or (public.auth_role() in ('STUDIO_ADMIN','COACH') and public.user_in_my_studio(user_id)));


-- ============================================================================
-- LISTO. El candado está puesto. Verifica que RLS quedó activo en las 11 tablas:
--   select tablename, rowsecurity from pg_tables
--   where schemaname = 'public' order by tablename;
-- La columna rowsecurity debe decir "true" en las 11.
-- ============================================================================
