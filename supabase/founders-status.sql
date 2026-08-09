-- ============================================================================
-- Move yA — Estado del Programa Fundador (para la landing pública)
-- ----------------------------------------------------------------------------
-- Devuelve cuántos de los 10 lugares de Fundador ya se ocuparon, para que la
-- landing muestre "quedan X de 10" y, al llenarse, cambie SOLA a la promo de
-- $1 · 14 días. Es SEGURA y PÚBLICA: solo expone un conteo, nunca datos de los
-- estudios. Cuenta los estudios cuya suscripción tiene founder = true.
--
-- Cómo usarlo: Supabase → SQL Editor → pega TODO → Run. Seguro correrlo de nuevo.
-- Si cambias el tope (env FOUNDER_LIMIT en la Edge Function), ajusta el 10 aquí.
-- ============================================================================

create or replace function public.founders_status()
returns json
language sql
security definer
set search_path = public
stable
as $$
  select json_build_object(
    'taken', (
      select count(*)::int
      from public.studios
      where (subscription->>'founder') = 'true'
    ),
    'limit', 10
  );
$$;

grant execute on function public.founders_status() to anon, authenticated;

-- Verifica:  select public.founders_status();
-- Debe regresar algo como {"taken":0,"limit":10}.
