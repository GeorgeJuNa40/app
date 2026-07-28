// ============================================================================
// Move yA — Edge Function: send-push
// ----------------------------------------------------------------------------
// Envía una notificación push a un alumno (o a ti mismo, como prueba). La usa
// el estudio, p. ej. desde "Recordatorios", para avisar como en WhatsApp.
//
// Requiere estos "secrets" en Supabase (Settings → Edge Functions → Secrets):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (ej. mailto:tu@correo.com)
// (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY ya los da la plataforma.)
//
// Deja "Enforce JWT" ACTIVADO: valida que quien llama sea el estudio.
// ============================================================================
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

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

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'mailto:soporte@moveya.app',
  Deno.env.get('VAPID_PUBLIC_KEY') ?? '',
  Deno.env.get('VAPID_PRIVATE_KEY') ?? '',
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    // Cliente con el token del usuario, para saber QUIÉN llama (RLS).
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

    const body = await req.json().catch(() => ({}));
    const targetUserId = String(body.userId ?? me.id);
    const title = String(body.title ?? 'Move yA');
    const message = String(body.body ?? '');
    const url = String(body.url ?? '/');

    // Solo el estudio puede enviar a OTROS usuarios; cualquiera puede enviarse a
    // sí mismo (útil para probar). El destino debe ser del mismo estudio.
    if (targetUserId !== me.id && me.role !== 'STUDIO_ADMIN') {
      return json({ error: 'Solo el estudio puede notificar a otros' }, 403);
    }

    // Cliente admin (service role) para leer las suscripciones del destino,
    // que RLS no dejaría ver a otro usuario.
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('studio_id', me.studio_id);

    if (!subs || subs.length === 0) {
      return json({ sent: 0, note: 'El destinatario no tiene notificaciones activas.' });
    }

    const payload = JSON.stringify({ title, body: message, url });
    let sent = 0;
    for (const s of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
        sent++;
      } catch (err) {
        // 404/410 = suscripción caducada: la borramos.
        const code = (err as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) {
          await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
        }
      }
    }
    return json({ sent });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
