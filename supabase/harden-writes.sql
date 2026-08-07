-- ============================================================================
-- Move yA — Blindaje de escrituras: créditos, estrellas y pagos por RPC
-- ----------------------------------------------------------------------------
-- Cierra un hueco de seguridad: antes, un alumno podía escribir directamente
-- (vía API) en user_packages / star_entries / bookings / payments y auto-
-- regalarse créditos o estrellas. Ahora:
--   * El alumno tiene SOLO LECTURA de sus filas en esas tablas.
--   * El personal (admin/coach) conserva escritura sobre su estudio.
--   * Las acciones del alumno (cancelar reserva, canjear recompensa) pasan por
--     funciones RPC seguras (SECURITY DEFINER) que validan todo en el servidor.
--   * El webhook de Stripe (service role) sigue escribiendo sin restricción.
--
-- Cómo usarlo: Supabase → SQL Editor → pega TODO → Run. Es seguro correrlo de
-- nuevo. Requiere que ya existan rls-policies.sql y booking-rpc.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. RPC: cancelar una reserva y DEVOLVER el crédito, de forma atómica.
-- ----------------------------------------------------------------------------
create or replace function public.cancel_booking(p_booking_id text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   text := auth.uid()::text;
  v_owner text;
  v_pkg   text;
  v_status text;
begin
  if v_uid is null then raise exception 'NOT_ALLOWED'; end if;

  select user_id, user_package_id, status into v_owner, v_pkg, v_status
  from public.bookings
  where id = p_booking_id
  for update;

  if v_owner is null then raise exception 'NOT_FOUND'; end if;

  -- Puede cancelar el dueño de la reserva, o el personal (admin/coach) del estudio.
  if v_owner <> v_uid
     and not (public.auth_role() in ('STUDIO_ADMIN','COACH') and public.user_in_my_studio(v_owner)) then
    raise exception 'NOT_ALLOWED';
  end if;

  if v_status = 'CANCELED' then
    return json_build_object('booking_id', p_booking_id, 'restored_package_id', null);
  end if;

  update public.bookings set status = 'CANCELED' where id = p_booking_id;

  -- Devuelve 1 crédito al paquete que se había usado (si aplica).
  if v_pkg is not null then
    update public.user_packages
      set credits_used = greatest(0, credits_used - 1)
      where id = v_pkg;
  end if;

  return json_build_object('booking_id', p_booking_id, 'restored_package_id', v_pkg);
end;
$$;
grant execute on function public.cancel_booking(text) to authenticated;


-- ----------------------------------------------------------------------------
-- 2. RPC: canjear una recompensa validando el saldo de estrellas en el servidor.
-- ----------------------------------------------------------------------------
create or replace function public.redeem_reward(p_reward_id text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     text := auth.uid()::text;
  v_studio  text;
  v_cost    int;
  v_active  boolean;
  v_balance int;
  v_entry   text;
begin
  if v_uid is null then raise exception 'NOT_ALLOWED'; end if;

  select studio_id, star_cost, active into v_studio, v_cost, v_active
  from public.rewards
  where id = p_reward_id;

  if v_studio is null then raise exception 'NOT_FOUND'; end if;
  if v_studio <> public.auth_studio_id() then raise exception 'NOT_ALLOWED'; end if;
  if v_active is not true then raise exception 'NOT_ACTIVE'; end if;

  -- Saldo actual de estrellas del alumno (bloquea sus filas para evitar doble canje).
  select coalesce(sum(delta), 0) into v_balance
  from public.star_entries
  where user_id = v_uid
  for update;

  if v_balance < v_cost then raise exception 'NO_STARS'; end if;

  v_entry := gen_random_uuid()::text;
  insert into public.star_entries (id, user_id, delta, reason)
    values (v_entry, v_uid, -v_cost, 'redemption');

  return json_build_object('entry_id', v_entry, 'new_balance', v_balance - v_cost);
end;
$$;
grant execute on function public.redeem_reward(text) to authenticated;


-- ----------------------------------------------------------------------------
-- 3. RLS: el ALUMNO queda en SOLO LECTURA en las tablas de valor; el personal
--    (admin/coach) conserva la escritura sobre su estudio. Las mutaciones del
--    alumno pasan por las RPC de arriba (y por book_session).
-- ----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['user_packages','bookings','star_entries','payments']
  loop
    -- Quita la política antigua permisiva (permitía escritura directa del alumno).
    execute format('drop policy if exists %I_access on public.%I', t, t);
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format('drop policy if exists %I_staff_write on public.%I', t, t);

    -- Lectura: el alumno ve lo suyo; el personal ve todo lo de su estudio.
    execute format($f$
      create policy %I_read on public.%I
        for select using (
          user_id = auth.uid()::text
          or (public.auth_role() in ('STUDIO_ADMIN','COACH') and public.user_in_my_studio(user_id))
        )
    $f$, t, t);

    -- Escritura: SOLO el personal (admin/coach) del estudio. El alumno NO escribe
    -- directo; sus acciones válidas pasan por las RPC (SECURITY DEFINER).
    execute format($f$
      create policy %I_staff_write on public.%I
        for all using (
          public.auth_role() in ('STUDIO_ADMIN','COACH') and public.user_in_my_studio(user_id)
        ) with check (
          public.auth_role() in ('STUDIO_ADMIN','COACH') and public.user_in_my_studio(user_id)
        )
    $f$, t, t);
  end loop;
end $$;

-- ============================================================================
-- LISTO. Verifica las políticas nuevas:
--   select tablename, policyname from pg_policies
--   where tablename in ('user_packages','bookings','star_entries','payments')
--   order by tablename, policyname;
-- ============================================================================
