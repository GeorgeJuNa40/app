-- ============================================================================
-- Move yA — Configuración de Login y Roles (Etapa 1, Paso 4)
-- ----------------------------------------------------------------------------
-- Conecta el sistema de login de Supabase (auth.users) con tu tabla `users`,
-- siguiendo el flujo de registro por CEU (Opción 1):
--
--   * Si la persona se registra con un CEU existente  -> entra como ALUMNO.
--   * Si se registra con un nombre de estudio (sin CEU) -> crea su ESTUDIO
--     y se vuelve ADMIN (con un CEU generado automáticamente).
--   * Los COACHES los da de alta el admin desde su panel (no se auto-registran).
--
-- Cómo usarlo:
--   1. Supabase -> "SQL Editor" -> "New query".
--   2. Borra lo que haya, pega TODO este archivo y presiona "Run".
--   3. Debe decir "Success". Solo se corre UNA vez.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- Función que se dispara SOLA cada vez que nace un login nuevo.
-- Lee los datos del registro y crea la ficha en tu tabla `users`
-- (y un estudio nuevo, si aplica).
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer                 -- corre con permisos elevados (aún no hay RLS)
set search_path = public
as $$
declare
  meta          jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_ceu         text  := nullif(trim(meta->>'ceu_code'), '');
  v_studio_name text  := nullif(trim(meta->>'studio_name'), '');
  v_full_name   text  := coalesce(nullif(trim(meta->>'full_name'), ''),
                                  split_part(new.email, '@', 1));
  v_studio_id   text;
  v_initials    text;
begin
  -- Iniciales para el avatar (ej. "Ana López" -> "AL")
  v_initials := upper(left(v_full_name, 1)) ||
                coalesce(upper(left(split_part(v_full_name, ' ', 2), 1)), '');

  if v_ceu is not null then
    -----------------------------------------------------------------
    -- CAMINO A: ALUMNO — el CEU debe existir
    -----------------------------------------------------------------
    select id into v_studio_id from public.studios where ceu_code = upper(v_ceu);
    if v_studio_id is null then
      raise exception 'El código de estudio (CEU) "%" no existe.', v_ceu;
    end if;

    insert into public.users (id, studio_id, role, full_name, email, avatar_initials)
    values (new.id::text, v_studio_id, 'STUDENT', v_full_name, new.email, v_initials);

  elsif v_studio_name is not null then
    -----------------------------------------------------------------
    -- CAMINO B: ESTUDIO NUEVO — la persona se vuelve ADMIN
    -----------------------------------------------------------------
    v_studio_id := gen_random_uuid()::text;

    insert into public.studios (id, name, ceu_code, email, branding, whatsapp, subscription)
    values (
      v_studio_id,
      v_studio_name,
      -- CEU autogenerado y único: primeras letras del nombre + 4 al azar
      upper(regexp_replace(left(v_studio_name, 4), '[^a-zA-Z0-9]', '', 'g'))
        || '-' || upper(substr(md5(random()::text), 1, 4)),
      new.email,
      jsonb_build_object(
        'primaryColor', '#2D5A4C', 'secondaryColor', '#F4F1EA',
        'accentColor', '#333333', 'fontFamily', 'Inter', 'logoText', v_studio_name
      ),
      jsonb_build_object(
        'number', '', 'botEnabled', false,
        'templates', '[]'::jsonb, 'knowledge', '[]'::jsonb
      ),
      jsonb_build_object(
        'status', 'TRIALING', 'priceUsd', 34.99, 'promoPriceUsd', 1,
        'trialDays', 14, 'isPromo', true,
        'trialEndsAt', (now() + interval '14 days'),
        'currentPeriodEnd', (now() + interval '14 days')
      )
    );

    insert into public.users (id, studio_id, role, full_name, email, avatar_initials)
    values (new.id::text, v_studio_id, 'STUDIO_ADMIN', v_full_name, new.email, v_initials);

  else
    -----------------------------------------------------------------
    -- Ni CEU ni nombre de estudio -> registro inválido
    -----------------------------------------------------------------
    raise exception 'Para registrarte indica un CEU (para unirte a un estudio) o un nombre de estudio (para crear uno nuevo).';
  end if;

  return new;
end;
$$;


-- ----------------------------------------------------------------------------
-- El "disparador": conecta la función de arriba con el login de Supabase.
-- ----------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================================
-- LISTO. Verifica que el disparador quedó instalado:
--   select tgname from pg_trigger where tgname = 'on_auth_user_created';
-- Debe devolver 1 fila.
-- ============================================================================
