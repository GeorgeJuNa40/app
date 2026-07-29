# Stripe Connect — cada estudio recibe sus propios pagos

Con esto, **cada estudio conecta su propia cuenta de Stripe** y los pagos en
línea de sus alumnos llegan **directo a su banco**. Tú (la plataforma) ya no
gestionas ese dinero y **no cobras comisión** (0%). Cada estudio paga las
comisiones normales de Stripe de sus propios cobros.

- Tipo de cuenta: **Express** (Stripe hospeda el registro; el estudio se da de
  alta con un formulario en minutos).
- Modelo: **cargo directo** en la cuenta del estudio.
- La **suscripción del estudio a Move yA** (lo que te pagan a ti) NO cambia:
  sigue cobrándose en tu cuenta de plataforma como hasta ahora.

---

## Lo que tienes que hacer tú (una sola vez)

### 1. Habilitar Connect en tu panel de Stripe
1. Entra a **https://dashboard.stripe.com** con tu cuenta (la de la plataforma).
2. Ve a **Connect** (menú lateral) → **Get started / Empezar**.
3. Elige la opción de **plataforma / marketplace** y activa **Express**.
4. Completa el perfil de plataforma que te pida Stripe (nombre, sitio, etc.).

> Si tus estudios están en un país distinto al de tu cuenta, revisa en Connect
> que ese país esté permitido (pagos transfronterizos). Para México/EE. UU. y la
> mayoría de países es directo.

### 2. Agregar las columnas en Supabase
En **Supabase → SQL Editor**, ejecuta `supabase/stripe-connect-setup.sql`
(agrega `stripe_account_id` y `stripe_charges_enabled` a la tabla `studios`).

### 3. Publicar la función `stripe-connect`
En **Supabase → Edge Functions**, crea/publica la función **`stripe-connect`**
con el contenido de `supabase/functions/stripe-connect/index.ts`.
- Deja **"Enforce JWT" ACTIVADO** (solo el estudio puede llamarla).
- Usa los secrets que ya tienes: `STRIPE_SECRET_KEY` y `APP_URL`.

### 4. Actualizar la función `stripe-checkout`
Vuelve a publicar **`stripe-checkout`** con el contenido actualizado de
`supabase/functions/stripe-checkout/index.ts` (ahora el pago del paquete se hace
en la cuenta del estudio). Sigue con **"Enforce JWT" ACTIVADO**.

### 5. Que el webhook escuche a las cuentas conectadas ⚠️ (importante)
Como el pago ahora ocurre en la cuenta del estudio, el webhook debe escuchar
también los eventos de las **cuentas conectadas**:
1. **Stripe → Developers → Webhooks** → abre tu endpoint de `stripe-webhook`.
2. En sus ajustes, activa **"Listen to events on Connected accounts"**
   (escuchar eventos de cuentas conectadas).
3. Asegúrate de que incluya el evento **`checkout.session.completed`**.

> Si no activas esto, el pago se cobra pero **no se registra** en la app. El
> mismo `STRIPE_WEBHOOK_SECRET` sirve para ambos tipos de evento; no cambia nada
> más. **No** necesitas volver a publicar la función `stripe-webhook`.

---

## Cómo lo usa cada estudio (dentro de la app)

1. El estudio entra a **Suscripción**. Arriba verá la tarjeta
   **"Recibe tus pagos en tu cuenta"**.
2. Toca **Conectar cuenta de pagos** → Stripe abre su registro (identidad y
   cuenta bancaria).
3. Al terminar, vuelve a la app y verá el estado **Activo**. Desde ahí puede
   abrir su **panel de Stripe** para ver sus cobros y depósitos.

Mientras un estudio **no** conecte su cuenta, sus alumnos verán un aviso al
intentar pagar en línea ("el estudio aún no activó los pagos"). El registro de
pagos en efectivo/tarjeta **en el estudio** (manual, en el CRM) sigue funcionando
igual, sin Stripe.

---

## Cómo probar
1. Con un estudio de prueba, conéctalo (paso "Cómo lo usa"). En modo prueba de
   Stripe puedes completar el registro con datos de test.
2. Como alumno, compra un paquete en línea. El cobro debe aparecer **en la cuenta
   del estudio** (no en la tuya), y el paquete/pago debe registrarse en la app.

---

## Notas
- **0% de comisión de plataforma:** no se cobra `application_fee`. Si más adelante
  quieres cobrar un %, se agrega en `stripe-checkout` (`application_fee_amount`).
- La app guarda solo el **id de la cuenta** del estudio y si **puede cobrar**;
  los datos bancarios los guarda **Stripe**, no la app.
