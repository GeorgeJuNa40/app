-- ============================================================================
-- Move yA — Reserva atómica de clases (Ronda 5, corrección A3)
-- ----------------------------------------------------------------------------
-- Crea la función book_session(): reserva una clase validando cupo, créditos y
-- vigencia del paquete DENTRO DE UNA SOLA TRANSACCIÓN con bloqueos de fila, para
-- que dos alumnos no puedan tomar el último lugar al mismo tiempo (sobrecupo) ni
-- descontar créditos de más.
--
-- Cómo usarlo:
--   1. Supabase -> "SQL Editor" -> "New query".
--   2. Pega TODO este archivo y presiona "Run". Debe decir "Success".
--   3. Es seguro correrlo más de una vez (reemplaza la función).
--
-- Mientras no corras este archivo, la app sigue funcionando con el método local
-- de respaldo (sin la protección contra sobrecupo simultáneo).
-- ============================================================================

create or replace function public.book_session(p_session_id text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid      text := auth.uid()::text;
  v_studio   text;
  v_cap      int;
  v_taken    int;
  v_pkg      text;
  v_booking  text;
  v_exist_id text;
  v_exist_st text;
begin
  if v_uid is null then
    raise exception 'NOT_ALLOWED';
  end if;

  -- Sesión + cupo (bloquea la fila de la sesión para serializar reservas).
  select studio_id, capacity into v_studio, v_cap
  from public.class_sessions
  where id = p_session_id
  for update;

  if v_studio is null then
    raise exception 'NOT_FOUND';
  end if;

  -- El alumno debe pertenecer al mismo estudio de la clase.
  if v_studio <> public.auth_studio_id() then
    raise exception 'NOT_ALLOWED';
  end if;

  -- ¿Ya existe una reserva de este alumno para esta sesión?
  select id, status into v_exist_id, v_exist_st
  from public.bookings
  where user_id = v_uid and session_id = p_session_id;

  if v_exist_id is not null and v_exist_st <> 'CANCELED' then
    raise exception 'ALREADY';
  end if;

  -- Cupo disponible (reservas no canceladas).
  select count(*) into v_taken
  from public.bookings
  where session_id = p_session_id and status <> 'CANCELED';

  if v_taken >= v_cap then
    raise exception 'FULL';
  end if;

  -- Elige un paquete usable (activo, con créditos y vigente); bloquea la fila.
  select id into v_pkg
  from public.user_packages
  where user_id = v_uid
    and active = true
    and credits_used < credits_total
    and expires_at > now()
  order by expires_at asc
  limit 1
  for update;

  if v_pkg is null then
    raise exception 'NO_CREDITS';
  end if;

  -- Reactiva la reserva cancelada o crea una nueva.
  if v_exist_id is not null then
    update public.bookings
      set status = 'RESERVED', user_package_id = v_pkg
      where id = v_exist_id;
    v_booking := v_exist_id;
  else
    v_booking := gen_random_uuid()::text;
    insert into public.bookings (id, user_id, session_id, user_package_id, status)
      values (v_booking, v_uid, p_session_id, v_pkg, 'RESERVED');
  end if;

  update public.user_packages
    set credits_used = credits_used + 1
    where id = v_pkg;

  return json_build_object(
    'booking_id', v_booking,
    'user_package_id', v_pkg,
    'status', 'RESERVED'
  );
end;
$$;

grant execute on function public.book_session(text) to authenticated;

-- ============================================================================
-- LISTO. Verifica que la función quedó instalada:
--   select proname from pg_proc where proname = 'book_session';
-- Debe devolver 1 fila.
-- ============================================================================
