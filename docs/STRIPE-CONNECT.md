# Stripe Connect — cada estudio recibe sus propios pagos

Con esto, **cada estudio conecta su propia cuenta de Stripe** y los pagos en
línea de sus alumnos llegan **directo a su banco**. Tú (la plataforma) ya no
gestionas ese dinero. Cada estudio paga las comisiones normales de Stripe de sus
propios cobros.

- Tipo de cuenta: **Express** (Stripe hospeda el registro; el estudio se da de
  alta con un formulario en minutos).
- Modelo: **cargo directo** en la cuenta del estudio.
- La **suscripción del estudio a Move yA** (lo que te pagan a ti) NO cambia:
  sigue cobrándose en tu cuenta de plataforma como hasta ahora.
- **Comisión de plataforma:** configurable. Con `PLATFORM_FEE_PERCENT` /
  `PLATFORM_FEE_FIXED` cobras al estudio un % (y/o fijo) por cada pago en línea
  de sus alumnos; ese remanente cubre el costo de Stripe/Radar y te deja margen.
  Si no defines nada, es **0%**.

> ⚠️ **Responsabilidad de pérdidas (Express):** al usar cuentas Express con
> cargo directo, la **plataforma** es responsable de los saldos negativos, y
> Stripe cobra **Radar** por cuenta conectada y por transacción. Por eso conviene
> cobrar una comisión de plataforma (ver más abajo) en vez de absorber ese costo.

---

## Lo que tienes que hacer tú (una sola vez)

### 1. Habilitar Connect y completar el perfil de plataforma
1. Entra a **https://dashboard.stripe.com** con tu cuenta (la de la plataforma).
2. Ve a **Connect** (menú lateral) → **Get started / Empezar**.
3. Elige la opción de **plataforma / marketplace** y activa **Express**.
4. Completa el **perfil de plataforma**:
   **https://dashboard.stripe.com/settings/connect/platform-profile**
   - **Flujo de fondos:** "los vendedores cobran directamente" (cargo directo).
   - **Responsabilidad por saldo negativo:** con Express la lleva la plataforma
     (tú). Dale **Confirmar** al reconocimiento.
   - **Cumplimiento continuo del vendedor:** dale **Confirmar** (con onboarding
     alojado por Stripe, casi todo lo hace Stripe).

> Si no completas el perfil, al conectar un estudio verás el error
> *"Please review the responsibilities of managing losses for connected
> accounts…"*. Se arregla confirmando esos reconocimientos en el link de arriba.

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

> Si no activas esto, el pago se cobra pero **no se registra** en la app. Con la
> nueva UI de Stripe cada webhook escucha un solo origen (tu cuenta O cuentas
> conectadas); por eso `stripe-webhook` acepta dos secretos:
> `STRIPE_WEBHOOK_SECRET` (tu cuenta) y `STRIPE_WEBHOOK_SECRET_CONNECT` (cuentas
> conectadas).

### 6. Configurar tu comisión de plataforma (opcional pero recomendado)
Para que **el estudio** pague el costo de Stripe/Radar (y tú no lo absorbas),
define en **Supabase → Edge Functions → Secrets** uno o ambos:
- `PLATFORM_FEE_PERCENT` — % del pago (ej. `5` = 5%).
- `PLATFORM_FEE_FIXED` — monto fijo por transacción, en la moneda del paquete
  (ej. `3` = 3 pesos). Opcional; puede quedar en 0.

La comisión sale de la **parte del estudio** (cargo directo), no se le suma al
alumno. Tras cambiar un secret, **vuelve a publicar `stripe-checkout`**. Si no
defines nada, la comisión es **0%**.

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
- **Comisión de plataforma:** se aplica como `application_fee_amount` sobre el
  cargo directo, configurable con `PLATFORM_FEE_PERCENT` / `PLATFORM_FEE_FIXED`
  (ver paso 6). Sin esos secrets, es 0%.
- La app guarda solo el **id de la cuenta** del estudio y si **puede cobrar**;
  los datos bancarios los guarda **Stripe**, no la app.
