// ============================================================================
// Move yA — Edge Function: stripe-connect
// ----------------------------------------------------------------------------
// Conecta la cuenta de Stripe (Express) de CADA estudio para que reciba los
// pagos de sus alumnos directo en su banco. La app (plataforma) no toca ese
// dinero y no cobra comisión (0%).
//
// Acciones (body.action):
//   - 'onboard'   -> crea la cuenta Express (si no existe) y devuelve el link
//                    de registro de Stripe (identidad + banco).
//   - 'status'    -> revisa si la cuenta ya puede cobrar y lo guarda.
//   - 'dashboard' -> link al panel de Stripe del estudio (ver sus cobros).
//
// Requiere estos "secrets" en Supabase: STRIPE_SECRET_KEY, APP_URL.
// (SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY ya los da la
// plataforma.)
//
// Deja "Enforce JWT" ACTIVADO: solo el estudio (admin) puede llamarla.
//
// ⚠️ En tu panel de Stripe debes tener Connect habilitado (Express).
// ============================================================================
import Stripe from 'npm:stripe@17.0.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});
const APP_URL = (Deno.env.get('APP_URL') ?? '').replace(/\/$/, '');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const authHeader = req.headers.get('Authorization') ?? '';
    const asUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await asUser.auth.getUser();
    const caller = userData.user;
    if (!caller) return json({ error: 'No autorizado' }, 401);

    const { data: me } = await asUser
      .from('users')
      .select('id, studio_id, role')
      .eq('id', caller.id)
      .single();
    if (!me) return json({ error: 'Usuario no encontrado' }, 404);
    if (me.role !== 'STUDIO_ADMIN') return json({ error: 'Solo el estudio' }, 403);

    // Cliente admin (service role) para leer/guardar la cuenta Connect del estudio.
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: studio } = await admin
      .from('studios')
      .select('id, name, email, branding, stripe_account_id')
      .eq('id', me.studio_id)
      .single();
    if (!studio) return json({ error: 'Estudio no encontrado' }, 404);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? '');
    let accountId: string | null = studio.stripe_account_id ?? null;

    // -------- ONBOARD: crea la cuenta (si falta) y devuelve el link de registro
    if (action === 'onboard') {
      if (!accountId) {
        const country = (studio.branding?.country ?? '') || undefined; // ISO del país (ej. MX)
        const account = await stripe.accounts.create({
          type: 'express',
          ...(country ? { country } : {}),
          ...(studio.email ? { email: studio.email } : {}),
          business_type: 'individual',
          capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
          metadata: { studio_id: studio.id },
        });
        accountId = account.id;
        await admin.from('studios').update({ stripe_account_id: accountId }).eq('id', studio.id);
      }

      const link = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${APP_URL}/#/admin/subscription`,
        return_url: `${APP_URL}/#/admin/subscription`,
        type: 'account_onboarding',
      });
      return json({ url: link.url });
    }

    // -------- STATUS: ¿ya puede cobrar? lo guardamos para el checkout
    if (action === 'status') {
      if (!accountId) return json({ connected: false, chargesEnabled: false });
      const account = await stripe.accounts.retrieve(accountId);
      const chargesEnabled = Boolean(account.charges_enabled);
      await admin.from('studios').update({ stripe_charges_enabled: chargesEnabled }).eq('id', studio.id);
      return json({ connected: true, chargesEnabled });
    }

    // -------- DASHBOARD: link al panel Express del estudio
    if (action === 'dashboard') {
      if (!accountId) return json({ error: 'Aún no has conectado tu cuenta.' }, 400);
      const login = await stripe.accounts.createLoginLink(accountId);
      return json({ url: login.url });
    }

    return json({ error: 'action inválida (usa onboard, status o dashboard)' }, 400);
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
