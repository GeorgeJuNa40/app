// ============================================================================
// Move yA — Edge Function: stripe-checkout
// ----------------------------------------------------------------------------
// Crea una sesión de Stripe Checkout (página de pago segura de Stripe) para:
//   - kind: 'package'       -> compra única de un paquete por un alumno
//   - kind: 'subscription'  -> suscripción mensual del estudio (Inicio/Pro/Premium)
//
// La app NUNCA recibe datos de tarjeta: el alumno los captura en la página de
// Stripe (cumplimiento PCI). Aquí solo se crea la sesión y se devuelve la URL.
//
// Requiere estos "secrets" en Supabase (Settings → Edge Functions → Secrets):
//   STRIPE_SECRET_KEY, APP_URL
// (SUPABASE_URL y SUPABASE_ANON_KEY ya vienen dados por la plataforma.)
//
// Esta función SÍ valida el JWT del usuario (déjala con "Enforce JWT" activado).
// ============================================================================
import Stripe from 'https://esm.sh/stripe@17.0.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
});
const APP_URL = (Deno.env.get('APP_URL') ?? '').replace(/\/$/, '');

// Precios mensuales de los planes del estudio (en centavos de USD).
const PLAN_PRICES: Record<string, number> = { inicio: 1999, pro: 3999, premium: 7999 };

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  try {
    // Cliente con el token del usuario: RLS asegura que solo vea su estudio.
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return json({ error: 'No autorizado' }, 401);

    const { data: me } = await supabase
      .from('users')
      .select('id, studio_id, role')
      .eq('id', user.id)
      .single();
    if (!me) return json({ error: 'Usuario no encontrado' }, 404);

    const body = await req.json().catch(() => ({}));
    const kind = body.kind as string;

    if (kind === 'package') {
      const { data: pkg } = await supabase
        .from('packages')
        .select('*')
        .eq('id', body.packageId)
        .single();
      if (!pkg) return json({ error: 'Paquete no encontrado' }, 404);

      const { data: studio } = await supabase
        .from('studios')
        .select('branding')
        .eq('id', me.studio_id)
        .single();
      const currency = (studio?.branding?.currencyCode ?? 'USD').toLowerCase();

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency,
              unit_amount: Math.round(Number(pkg.price_usd) * 100),
              product_data: {
                name: pkg.name,
                description: pkg.description || undefined,
              },
            },
          },
        ],
        success_url: `${APP_URL}/?pago=exito`,
        cancel_url: `${APP_URL}/?pago=cancelado`,
        metadata: {
          kind: 'package',
          user_id: me.id,
          studio_id: me.studio_id,
          package_id: pkg.id,
        },
      });
      return json({ url: session.url });
    }

    if (kind === 'subscription') {
      if (me.role !== 'STUDIO_ADMIN') return json({ error: 'Solo el estudio' }, 403);
      const plan = String(body.plan);
      const amount = PLAN_PRICES[plan];
      if (!amount) return json({ error: 'Plan inválido' }, 400);

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'usd', // la suscripción SaaS se cobra en USD
              unit_amount: amount,
              recurring: { interval: 'month' },
              product_data: { name: `Move yA · Plan ${plan}` },
            },
          },
        ],
        success_url: `${APP_URL}/?suscripcion=exito`,
        cancel_url: `${APP_URL}/?suscripcion=cancelado`,
        metadata: { kind: 'subscription', studio_id: me.studio_id, plan },
      });
      return json({ url: session.url });
    }

    return json({ error: 'kind inválido (usa "package" o "subscription")' }, 400);
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
