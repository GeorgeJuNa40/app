import { supabase } from './supabase';
import { notifyError } from './notify';

// Datos para iniciar un pago con Stripe (vía la Edge Function stripe-checkout).
type CheckoutBody =
  | { kind: 'package'; packageId: string }
  | { kind: 'subscription'; plan: string };

// Pide a Stripe una sesión de pago y redirige a su página segura.
// Devuelve false si algo falla (para que quien llama reactive el botón).
export async function startStripeCheckout(body: CheckoutBody): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('stripe-checkout', { body });
    if (error) {
      notifyError('pago', 'No se pudo iniciar el pago. Inténtalo de nuevo.');
      return false;
    }
    const url = (data as { url?: string } | null)?.url;
    if (!url) {
      notifyError('pago', 'No se recibió el enlace de pago.');
      return false;
    }
    window.location.href = url; // redirige a la página segura de Stripe Checkout
    return true;
  } catch {
    notifyError('pago', 'No se pudo iniciar el pago. Inténtalo de nuevo.');
    return false;
  }
}
