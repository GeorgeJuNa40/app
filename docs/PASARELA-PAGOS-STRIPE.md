# Pasarela de pagos con Stripe — Guía de configuración

Esta guía activa los pagos reales con **Stripe** para:
- **Paquetes de alumnos** (cobro único).
- **Suscripción del estudio** (cobro mensual de los planes Inicio/Pro/Premium).

La app **nunca** recibe datos de tarjeta: el pago ocurre en la página segura de
Stripe (Stripe Checkout), lo cual cumple con PCI.

> **Leyenda:** 🧑‍💻 = lo hago yo (código) · 🙋 = lo haces tú (cuentas/llaves).
> Todo se hace primero en **modo prueba (test)**; el paso a producción es al final.

---

## 🔐 Regla de oro de seguridad

Stripe te da dos llaves:
- **Publicable** (`pk_test_...`) → puede ir en el navegador. **Se puede compartir.**
- **Secreta** (`sk_test_...`) → da control total de tu cuenta. **NUNCA la pegues
  en el chat, ni en el código, ni en GitHub.** Solo va dentro de los *Secrets* de
  Supabase (paso 3). Si alguna vez se expone, se **rota** desde Stripe.

*(Con la arquitectura de esta integración, la app ni siquiera necesita la llave
publicable: todo el pago pasa por Stripe Checkout.)*

---

## Paso 1 — 🙋 Crear cuenta de Stripe

1. Entra a https://stripe.com y crea una cuenta del negocio.
2. Activa el **modo prueba** (interruptor "Test mode" arriba a la derecha).
3. Ve a **Developers → API keys**. Ahí verás tu **Secret key** (`sk_test_...`).
   No la copies a ningún lado todavía; la usarás en el paso 3.

## Paso 2 — 🧑‍💻 / 🙋 Base de datos

- 🧑‍💻 Ya está el archivo `supabase/stripe-setup.sql`.
- 🙋 Córrelo una vez: Supabase → **SQL Editor** → pega `supabase/stripe-setup.sql`
  → **Run**. (Agrega la columna que evita cobros duplicados.)

## Paso 3 — 🙋 Cargar los "secrets" en Supabase

En Supabase → **Project Settings → Edge Functions → Secrets** (o
**Settings → Functions → Secrets**), agrega:

| Nombre | Valor |
|---|---|
| `STRIPE_SECRET_KEY` | tu `sk_test_...` de Stripe |
| `APP_URL` | la URL de tu app en Vercel (ej. `https://tu-app.vercel.app`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → *service_role* (secreta) |
| `STRIPE_WEBHOOK_SECRET` | lo obtienes en el **paso 5** (déjalo pendiente) |

> `SUPABASE_URL` y `SUPABASE_ANON_KEY` ya los provee Supabase automáticamente.

## Paso 4 — 🙋 Desplegar las dos funciones

Están en `supabase/functions/`. Tienes dos formas:

**Opción A — desde el panel (más fácil, sin instalar nada):**
Supabase → **Edge Functions → Deploy a new function** → crea:
- `stripe-checkout` → pega el contenido de `supabase/functions/stripe-checkout/index.ts`.
- `stripe-webhook` → pega el contenido de `supabase/functions/stripe-webhook/index.ts`.
  En **esta** función, **desactiva "Enforce JWT"** (Stripe no manda token de usuario).

**Opción B — con la CLI de Supabase (si prefieres terminal):**
```
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook --no-verify-jwt
```

## Paso 5 — 🙋 Conectar el webhook de Stripe

1. Stripe → **Developers → Webhooks → Add endpoint**.
2. URL del endpoint:
   `https://<TU-PROYECTO>.supabase.co/functions/v1/stripe-webhook`
3. Eventos a escuchar: **`checkout.session.completed`**
   (más adelante, para bajas: `customer.subscription.deleted`).
4. Al crearlo, Stripe te da un **Signing secret** (`whsec_...`).
   Cópialo y pégalo en el secret `STRIPE_WEBHOOK_SECRET` (paso 3) → guarda.

## Paso 6 — 🧑‍💻 Conectar la app (frontend)

Yo cableo la app para que:
- El botón **Comprar** de un paquete llame a `stripe-checkout` y te lleve a Stripe.
- El botón de **elegir plan** en Suscripción haga lo mismo para la suscripción.
- Si las funciones aún no están desplegadas, la app **sigue funcionando** con el
  flujo simulado actual (no se rompe nada mientras configuras Stripe).

## Paso 7 — 🙋 Probar en modo prueba

Con una **tarjeta de prueba de Stripe**:
- Número: `4242 4242 4242 4242` · Fecha: cualquiera futura · CVC: cualquiera.

Verifica:
- [ ] Comprar un paquete → te manda a Stripe → pagas → regresas a la app y el
      paquete aparece activo (lo creó el webhook).
- [ ] Elegir un plan de suscripción → pago → el estudio queda **ACTIVE**.
- [ ] En Stripe → **Payments** ves los cobros de prueba.

## Paso 8 — 🙋 Paso a producción (cuando todo funcione en prueba)

1. En Stripe, **desactiva Test mode** y saca las llaves **live** (`sk_live_...`).
2. Actualiza `STRIPE_SECRET_KEY` (live) en los secrets de Supabase.
3. Crea un **webhook nuevo** en modo live y actualiza `STRIPE_WEBHOOK_SECRET`.
4. Completa el **activate account** de Stripe (datos del negocio/bancarios) para
   poder recibir depósitos reales.

---

### Resumen de "tu tarea" para arrancar
1. Crear cuenta de Stripe (modo prueba) y ubicar la **secret key**.
2. Correr `supabase/stripe-setup.sql`.
3. Cargar los secrets en Supabase.
4. Desplegar las 2 funciones (webhook sin JWT).
5. Crear el webhook en Stripe y pegar su `whsec_...`.

En cuanto tengas del 1 al 5, yo conecto el frontend (paso 6) y probamos juntos
con las tarjetas de prueba.
