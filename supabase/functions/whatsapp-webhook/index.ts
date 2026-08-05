// ============================================================================
// Move yA — Edge Function: whatsapp-webhook
// ----------------------------------------------------------------------------
// Recibe los mensajes que le escriben al número de WhatsApp del estudio y
// responde automáticamente (el "bot"). Meta (WhatsApp Cloud API) llama a esta
// función cada vez que llega un mensaje.
//
// Secrets requeridos en Supabase (Settings → Edge Functions → Secrets):
//   WHATSAPP_VERIFY_TOKEN  -> palabra secreta que TÚ inventas (la misma de Meta).
//   WHATSAPP_TOKEN         -> token de acceso de WhatsApp (para poder enviar).
//
// IMPORTANTE: despliega con "Verify JWT" DESACTIVADO.
//
// Esta versión escribe LOGS detallados para diagnosticar: verás en los logs
// cada POST que llega, el mensaje, y la respuesta de la API de WhatsApp.
// ============================================================================

const GRAPH = 'https://graph.facebook.com/v21.0';
const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN') ?? '';
const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_TOKEN') ?? '';

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // -------- 1) Verificación del webhook (Meta hace un GET al configurarlo).
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    console.log('🔎 GET verificación:', { mode, tokenOk: token === VERIFY_TOKEN });
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return new Response(challenge ?? '', { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  // -------- 2) Mensajes entrantes (POST).
  if (req.method === 'POST') {
    const raw = await req.text();
    // Log SIEMPRE que llega un POST (así sabemos si Meta nos está llamando).
    console.log('📩 POST recibido:', raw.slice(0, 800));

    let body: Record<string, unknown> = {};
    try {
      body = JSON.parse(raw);
    } catch {
      console.log('⚠️ POST sin JSON válido');
    }

    try {
      // deno-lint-ignore no-explicit-any
      const value = (body as any)?.entry?.[0]?.changes?.[0]?.value;
      const msg = value?.messages?.[0];
      const phoneNumberId = value?.metadata?.phone_number_id;

      if (msg && msg.type === 'text' && phoneNumberId) {
        const from = msg.from as string;
        const text = (msg.text?.body as string) ?? '';
        console.log(`💬 Mensaje de ${from}: "${text}" (phone_number_id=${phoneNumberId})`);

        if (!WHATSAPP_TOKEN) {
          console.error('⚠️ Falta el secret WHATSAPP_TOKEN — no puedo responder.');
        } else {
          const reply = botReply(text);
          await sendText(phoneNumberId, from, reply);
        }
      } else {
        console.log('ℹ️ POST sin mensaje de texto (probablemente un status/recibo).');
      }
    } catch (e) {
      console.error('❌ Error procesando el mensaje:', (e as Error).message);
    }

    return new Response('EVENT_RECEIVED', { status: 200 });
  }

  return new Response('Method not allowed', { status: 405 });
});

// Envía un mensaje de texto por la Cloud API de WhatsApp y SIEMPRE registra la
// respuesta de la API (para ver si funcionó o qué error da).
async function sendText(phoneNumberId: string, to: string, bodyText: string) {
  const res = await fetch(`${GRAPH}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: bodyText },
    }),
  });
  const txt = await res.text();
  if (res.ok) {
    console.log('✅ WhatsApp aceptó el envío:', txt.slice(0, 300));
  } else {
    console.error('❌ WhatsApp rechazó el envío:', res.status, txt.slice(0, 400));
  }
}

// Bot simple por reglas (respuesta de arranque). Luego lo cambiamos por la base
// de conocimiento del estudio + IA (Claude).
function botReply(question: string): string {
  const q = question.toLowerCase();
  if (/hola|buenas|buenos|hey|qué tal|que tal/.test(q))
    return '¡Hola! 👋 Soy el asistente del estudio. Puedo ayudarte con horarios, paquetes o reservas. ¿Qué necesitas?';
  if (/gracias/.test(q)) return '¡Con gusto! 🙌 Aquí estoy para lo que necesites.';
  if (/horario|clase|reserva|reservar|agenda/.test(q))
    return 'Con gusto 📅 Puedes ver los horarios y reservar tu clase desde la app. ¿Te paso el enlace?';
  if (/pago|paquete|precio|costo|cuánto|cuanto/.test(q))
    return 'Tenemos varios paquetes 💳 Puedes verlos y pagarlos desde la app. ¿Te ayudo a elegir uno?';
  if (/ubicación|ubicacion|dónde|donde|dirección|direccion/.test(q))
    return 'Con gusto te comparto la ubicación 📍. Un momento y te atendemos.';
  return 'Gracias por tu mensaje 🙏 En breve te atendemos. Mientras tanto, ¿te ayudo con horarios, pagos o reservas?';
}
