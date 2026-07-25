# Pendientes para producción — Move yA

Lista viva de los ajustes que **no** son necesarios para el MVP/pruebas, pero
que **sí** hay que resolver antes de cobrar de verdad y abrir la app al público.
Cada uno indica qué es, por qué importa y cómo resolverlo.

> Recordatorio: retomar este archivo cuando empecemos la **preparación de
> producción** (pasarela de pagos real + alta masiva de estudios).

---

## M1 — Pasarela de pago real (Stripe / PayPal)

**Estado:** pendiente. Hoy el checkout de paquetes (`src/features/student/MyPackages.tsx`)
es una **simulación**: muestra un formulario de tarjeta y "aprueba" el pago con un
`setTimeout`, sin cobrar nada.

**Por qué importa:**
- No se cobra dinero de verdad.
- **Cumplimiento PCI:** una app **nunca** debe capturar/almacenar el número de
  tarjeta ni el CVC directamente. Eso obliga a usar los componentes del proveedor
  (Stripe Elements / PayPal Buttons), que reciben los datos de la tarjeta en un
  iframe seguro del proveedor — el número **nunca** toca nuestro código.

**Cómo resolverlo:**
1. Crear cuenta de Stripe (y/o PayPal) del negocio.
2. Backend mínimo (Supabase Edge Function) que cree el `PaymentIntent` /
   orden y devuelva el `client_secret`. La llave secreta vive **solo** en el
   servidor, nunca en el front.
3. En el front, reemplazar el formulario de tarjeta manual por **Stripe Elements**
   (o PayPal Buttons). Quitar los inputs de número/CVC actuales.
4. Confirmar el pago con webhooks de Stripe → al confirmarse, crear el
   `user_package` + `payment` (idealmente en el webhook del servidor, no en el
   cliente, para que no dependa de que el navegador no se cierre).
5. Aplicar el mismo enfoque a la **suscripción del estudio** (`SubscriptionScreen`),
   que hoy también se activa de forma simulada (Stripe Billing / suscripciones).

---

## M2 — Alinear el trigger de registro (SQL) con el estado actual

**Estado:** pendiente. El trigger `handle_new_user` (`supabase/auth-setup.sql`)
siembra al crear un estudio nuevo una suscripción con datos **desactualizados** y
no guarda algunos datos del registro:

- `subscription.priceUsd` se siembra en **34.99** y **sin** `plan` (hoy el plan por
  defecto es `pro` a **39.99**). Funciona porque el front rellena los faltantes al
  leer (`mapStudio` mezcla con los valores por defecto), pero conviene alinearlo.
- No guarda el **teléfono** del estudio ni el `country`/`currency` en la fila del
  estudio; hoy eso se rellena desde el cliente (hidratación de metadatos). Es más
  robusto persistirlo desde el trigger.

**Cómo resolverlo (una migración SQL):**
1. En `handle_new_user`, al crear el estudio:
   - Sembrar la suscripción con `'plan','pro'` y `'priceUsd',39.99`.
   - Leer `meta->>'phone'` y guardarlo en `studios.phone`.
   - Guardar `country`/`currency` (dentro de `branding` jsonb, que es donde el
     front los espera: `branding.country`, `branding.currencyCode`).
2. Al crear el usuario (los 3 caminos: admin, coach, alumno), guardar
   `meta->>'phone'` en `users.phone`.
3. Correr la migración en Supabase (SQL Editor → Run). Es idempotente
   (`create or replace function`).

> Nota: esto es una mejora de robustez; la hidratación en el cliente ya cubre el
> caso hoy, así que no bloquea nada.

---

## P1 — Carga de datos escalable (paginación / agregados en servidor)

**Estado:** pendiente (mejora de escalado, no urgente en el piloto). Hoy
`loadDatabase()` (`src/lib/repo.ts`) trae **todas las filas de las 11 tablas** al
iniciar sesión. Con un estudio con miles de reservas/pagos/estrellas acumulados en
el tiempo, esa carga inicial crecerá y se volverá lenta.

**Por qué no se "parchó" ya:** las tablas que crecen (`bookings`, `payments`,
`star_entries`) alimentan **totales y saldos** (ingresos en Reportes, saldo de
estrellas, cupo de clases). Ponerles un límite a la ligera **rompería** esos
cálculos. La solución correcta es un rediseño, no un recorte.

**Cómo resolverlo (cuando el volumen lo pida):**
1. Mover los agregados al servidor con **vistas / RPC**:
   - Ingresos y desglose por método → una vista/RPC que devuelva sumas, en vez de
     traer todos los `payments`.
   - Saldo de estrellas por usuario → una vista con el `sum(delta)`.
   - Cupo por sesión → contar reservas en el servidor (o materializar el conteo).
2. Paginar las listas históricas (pagos, reservas) con `range()` y orden por
   fecha, cargando "más" bajo demanda.
3. Cargar por ruta/rol solo lo que cada pantalla necesita (lazy data), en vez de
   todo al inicio.

---

## Otros pendientes menores (registrados)

- **B-varios** (ya resueltos en la Ronda 5): validaciones de formularios, estados
  vacíos, accesibilidad de modales, símbolo por moneda y barras de progreso.
- **P2 / P3** (resueltos en la Ronda 5): code-splitting por ruta y
  re-sincronización automática ante fallos de guardado.
