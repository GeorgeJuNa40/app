// Notificaciones push (Web Push). Permite que el usuario active avisos que
// llegan como los de WhatsApp/Facebook, incluso con la app cerrada (requiere
// que la app esté instalada en el celular, sobre todo en iPhone).
//
// La llave pública VAPID se lee de una variable de entorno pública (segura para
// el navegador). Configúrala en Vercel como VITE_VAPID_PUBLIC_KEY.
import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

// ¿El navegador soporta notificaciones push?
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function pushPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

// ¿Están configuradas las llaves para push? (si no, ocultamos el botón).
export function isPushConfigured(): boolean {
  return Boolean(VAPID_PUBLIC_KEY);
}

// Convierte la llave VAPID (base64url) al formato que espera el navegador.
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

// Pide permiso, se suscribe al push y guarda la suscripción en Supabase.
// Devuelve true si quedó activo. Requiere que exista el service worker.
export async function enablePush(userId: string, studioId: string): Promise<boolean> {
  if (!isPushSupported() || !VAPID_PUBLIC_KEY) return false;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });
  }

  const json = sub.toJSON();
  const keys = json.keys ?? {};
  // upsert por endpoint: si el mismo navegador se re-suscribe, no duplica.
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      studio_id: studioId,
      endpoint: sub.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    { onConflict: 'endpoint' },
  );
  if (error) {
    console.error('guardar suscripción push:', error.message);
    return false;
  }
  return true;
}

// Cancela la suscripción en el navegador y la borra de Supabase.
export async function disablePush(): Promise<void> {
  if (!isPushSupported()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe().catch(() => {});
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
}

// El estudio envía una notificación push a un alumno (vía Edge Function).
// Devuelve cuántos dispositivos la recibieron (0 si el alumno no la activó).
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  url = '/',
): Promise<{ sent: number; error?: string }> {
  const { data, error } = await supabase.functions.invoke('send-push', {
    body: { userId, title, body, url },
  });
  if (error) return { sent: 0, error: error.message };
  return { sent: (data as { sent?: number })?.sent ?? 0 };
}

// ¿Este navegador ya tiene una suscripción activa?
export async function hasActivePush(): Promise<boolean> {
  if (!isPushSupported() || Notification.permission !== 'granted') return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}
