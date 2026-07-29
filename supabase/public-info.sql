-- ============================================================================
-- Move yA — Página informativa PÚBLICA del estudio
-- ----------------------------------------------------------------------------
-- Permite que CUALQUIER persona (sin iniciar sesión) vea la página informativa
-- de un estudio a partir de su código CEU, SIN exponer datos privados. Solo
-- devuelve: nombre, código, branding (colores/logo/info pública) y fotos.
--
-- Cómo usarlo: Supabase → SQL Editor → pega TODO → Run. Debe decir "Success".
-- Es seguro correrlo de nuevo.
-- ============================================================================

create or replace function public.get_public_studio(p_ceu text)
returns jsonb
language sql
security definer            -- corre con permisos elevados, pero SOLO devuelve lo de abajo
set search_path = public
stable
as $$
  select jsonb_build_object(
    'name', s.name,
    'ceuCode', s.ceu_code,
    'branding', s.branding,
    'photos', coalesce(s.photos, '[]'::jsonb)
  )
  from public.studios s
  where s.ceu_code = upper(p_ceu)
  limit 1;
$$;

-- Deja que los visitantes anónimos (y los usuarios) puedan llamarla.
grant execute on function public.get_public_studio(text) to anon, authenticated;
