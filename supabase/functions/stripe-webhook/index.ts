// ============================================================================
// Move yA — Edge Function: stripe-webhook
// ----------------------------------------------------------------------------
// Stripe llama a esta función cuando un pago se confirma. Aquí (en el servidor,
// no en el navegador) creamos el registro real:
//   - Paquete de alumno  -> crea user_package + payment
//   - Suscripción estudio -> marca la suscripción del estudio como ACTIVE
//
// Escribe con la SERVICE ROLE KEY (salta RLS). Es idempotente: si Stripe reenvía
// el mismo evento, no duplica (usa payments.stripe_session_id).
//
// Requiere estos "secrets" en Supabase:
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY
//
// IMPORTANTE: despliega esta función con "Enforce JWT" DESACTIVADO (Stripe no
// envía un JWT de usuario; la seguridad la da la firma del webhook).
// ============================================================================
import Stripe from 'https://esm.sh/stripe@17.0.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
});
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

// Cliente administrador (service role) — solo existe aquí, en el servidor.
const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const DAY = 86400000;

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature') ?? '';
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, webhookSecret);
  } catch (e) {
    return new Response(`Firma inválida: ${(e as Error).message}`, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object as Stripe.Checkout.Session;
      const m = (s.metadata ?? {}) as Record<string, string>;
      if (m.kind === 'package') await applyPackage(m, s);
      else if (m.kind === 'subscription') await applySubscription(m, s);
    }
  } catch (e) {
    // Devolver 500 hace que Stripe reintente el evento más tarde.
    return new Response(`Error: ${(e as Error).message}`, { status: 500 });
  }

  return new Response('ok', { status: 200 });
});

async function applyPackage(m: Record<string, string>, s: Stripe.Checkout.Session) {
  // Idempotencia: si ya registramos este pago, no lo dupliques.
  const { data: existing } = await admin
    .from('payments')
    .select('id')
    .eq('stripe_session_id', s.id)
    .maybeSingle();
  if (existing) return;

  const { data: pkg } = await admin
    .from('packages')
    .select('*')
    .eq('id', m.package_id)
    .single();
  if (!pkg) return;

  const now = new Date();
  const expires = new Date(now.getTime() + pkg.validity_days * DAY);

  await admin.from('user_packages').insert({
    id: crypto.randomUUID(),
    user_id: m.user_id,
    package_id: pkg.id,
    credits_total: pkg.class_credits,
    credits_used: 0,
    purchased_at: now.toISOString(),
    expires_at: expires.toISOString(),
    active: true,
  });

  await admin.from('payments').insert({
    id: crypto.randomUUID(),
    user_id: m.user_id,
    amount_usd: pkg.price_usd,
    method: 'card',
    package_id: pkg.id,
    concept: pkg.name,
    paid_at: now.toISOString(),
    registered_by: 'online',
    stripe_session_id: s.id,
  });
}

async function applySubscription(m: Record<string, string>, s: Stripe.Checkout.Session) {
  const end = new Date(Date.now() + 30 * DAY);
  const { data: studio } = await admin
    .from('studios')
    .select('subscription')
    .eq('id', m.studio_id)
    .single();

  const next = {
    ...(studio?.subscription ?? {}),
    status: 'ACTIVE',
    plan: m.plan,
    currentPeriodEnd: end.toISOString(),
    stripeCustomerId: s.customer,
    stripeSubscriptionId: s.subscription,
  };

  await admin.from('studios').update({ subscription: next }).eq('id', m.studio_id);
}
