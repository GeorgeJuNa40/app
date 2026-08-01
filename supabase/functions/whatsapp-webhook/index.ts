// ============================================================================
// Move yA — Edge Function: whatsapp-webhook
// ----------------------------------------------------------------------------
// Recibe los mensajes que le escriben al número de WhatsApp del estudio y
// responde automáticamente (el "bot"). Meta (WhatsApp Cloud API) llama a esta
// función cada vez que llega un mensaje.
//
// Dos partes:
//   - GET  -> "handshake" de verificación que hace Meta al configurar el webhook
//             (responde el hub.challenge si el verify_token coincide).
//   - POST -> mensaje entrante: genera una respuesta y la envía por WhatsApp.
//
// Requiere estos "secrets" en Supabase (Settings → Edge Functions → Secrets):
//   WHATSAPP_VERIFY_TOKEN  -> una palabra secreta que TÚ inventas (la misma que
//                             pondrás en Meta al configurar el webhook).
//   WHATSAPP_TOKEN         -> el token de acceso de WhatsApp (para poder enviar).
//                             En pruebas es el token temporal (24 h) de Meta.
//
// IMPORTANTE: despliega esta función con "Verify JWT" DESACTIVADO (Meta no envía
// un JWT de usuario; la seguridad la da el verify token y, opcionalmente, la
// firma del webhook).
//
// NOTA: por ahora el bot responde con reglas simples (saludos, horarios, pagos).
// En el siguiente paso lo conectamos a la base de conocimiento de cada estudio
// y a la IA (Claude) para respuestas de verdad.
// ============================================================================

// Versión del Graph API de Meta (si algún día Meta pide otra, se cambia aquí).
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
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Devolvemos el challenge tal cual para que Meta valide el webhook.
      return new Response(challenge ?? '', { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  // -------- 2) Mensajes entrantes (POST).
  if (req.method === 'POST') {
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      /* cuerpo vacío o no-JSON: lo ignoramos */
    }

    try {
      // Estructura del webhook de WhatsApp: entry[0].changes[0].value
      // deno-lint-ignore no-explicit-any
      const value = (body as any)?.entry?.[0]?.changes?.[0]?.value;
      const msg = value?.messages?.[0];
      const phoneNumberId = value?.metadata?.phone_number_id;

      // Solo respondemos a mensajes de texto (ignoramos recibos de entrega, etc.)
      if (msg && msg.type === 'text' && phoneNumberId && WHATSAPP_TOKEN) {
        const from = msg.from as string;
        const text = (msg.text?.body as string) ?? '';
        const reply = botReply(text);
        await sendText(phoneNumberId, from, reply);
      }
    } catch (e) {
      // No fallamos hacia Meta: registramos y devolvemos 200 igual, para que
      // WhatsApp no reintente el mismo evento una y otra vez.
      console.error('whatsapp-webhook error:', (e as Error).message);
    }

    // Responder 200 rápido es obligatorio (si no, Meta reintenta el evento).
    return new Response('EVENT_RECEIVED', { status: 200 });
  }

  return new Response('Method not allowed', { status: 405 });
});

// Envía un mensaje de texto por la Cloud API de WhatsApp. Solo se permite texto
// libre dentro de las 24 h de que el usuario escribió (que es justo este caso).
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
  if (!res.ok) {
    console.error('Error al enviar WhatsApp:', res.status, await res.text());
  }
}

// Bot simple por reglas (respuesta de arranque). En el siguiente paso esto se
// reemplaza por la base de conocimiento del estudio + IA (Claude).
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
