-- ============================================================================
-- Move yA — Uso justo del bot de WhatsApp con IA
-- ----------------------------------------------------------------------------
-- Cuenta cuántos mensajes con IA respondió el bot por estudio y por mes, para
-- respetar el tope de uso justo (protege el gasto de la API de Claude).
--
-- SOLO se necesita cuando actives la IA (cuando pongas ANTHROPIC_API_KEY).
-- Antes de eso el bot usa reglas gratis y esta tabla no se toca.
--
-- Cómo aplicarla: Supabase -> SQL Editor -> pega este archivo -> Run.
-- ============================================================================

create table if not exists whatsapp_usage (
  studio_id  uuid        not null references studios(id) on delete cascade,
  ym         text        not null,               -- mes en formato "AAAA-MM"
  count      int         not null default 0,
  updated_at timestamptz not null default now(),
  primary key (studio_id, ym)
);

-- Solo el service role (el webhook) accede a esta tabla; RLS activo sin
-- políticas = nadie más la ve. El service role la usa igual (salta RLS).
alter table whatsapp_usage enable row level security;

-- Suma 1 al contador del estudio en el mes dado y devuelve el nuevo total.
-- security definer: corre con permisos del dueño, sin depender de RLS.
create or replace function bump_whatsapp_usage(p_studio uuid, p_ym text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
begin
  insert into whatsapp_usage (studio_id, ym, count)
  values (p_studio, p_ym, 1)
  on conflict (studio_id, ym)
  do update set count = whatsapp_usage.count + 1, updated_at = now()
  returning count into new_count;
  return new_count;
end;
$$;
