# Notificaciones push (Web Push) — guía de activación

Las notificaciones push hacen que los avisos lleguen al celular **como los de
WhatsApp o Facebook**, aunque la app esté cerrada. En Move yA se usan para:

- **Recordatorio de clase**: al alumno con reserva, 24 h antes de su clase.
- **Paquete por vencer**: al alumno cuyo paquete vence en 3 días o menos.
- **Recordatorio manual**: el estudio puede enviar un aviso desde *Recordatorios*
  con el botón **🔔 Recordar por notificación**.

> **iPhone/iPad:** Apple solo permite push si la app está **instalada en la
> pantalla de inicio** (botón "Instalar app" → en iPhone, "Agregar a inicio").
> En Android y computadora funciona con la app instalada o incluso en el navegador.

El alumno (o el estudio) activa las notificaciones con el botón
**🔔 Activar notificaciones** que aparece en la barra lateral.

---

## Qué tienes que hacer tú (una sola vez)

### 1. Generar las llaves VAPID

En tu computadora (o en cualquier terminal con Node) corre:

```bash
npx web-push generate-vapid-keys
```

Te dará dos valores: **Public Key** y **Private Key**. Guárdalos.

> ⚠️ La **Private Key es secreta**: NO la pongas en el código ni la compartas.
> Solo va en los *secrets* de Supabase (paso 3).

### 2. Publicar la llave pública en Vercel

En **Vercel → tu proyecto → Settings → Environment Variables** agrega:

| Nombre                   | Valor                     |
| ------------------------ | ------------------------- |
| `VITE_VAPID_PUBLIC_KEY`  | *(tu Public Key)*         |

Vuelve a publicar (Deploy) para que el botón de notificaciones aparezca.

### 3. Guardar los secrets en Supabase

En **Supabase → Settings → Edge Functions → Secrets** agrega:

| Nombre               | Valor                                      |
| -------------------- | ------------------------------------------ |
| `VAPID_PUBLIC_KEY`   | *(tu Public Key)*                          |
| `VAPID_PRIVATE_KEY`  | *(tu Private Key — secreta)*               |
| `VAPID_SUBJECT`      | `mailto:tucorreo@ejemplo.com`              |

(`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` ya los da la plataforma.)

### 4. Crear la tabla de suscripciones

En **Supabase → SQL Editor**, abre y ejecuta `supabase/push-setup.sql`.

### 5. Publicar las dos funciones

En **Supabase → Edge Functions**, crea/publica:

- **`send-push`** — deja **"Enforce JWT" ACTIVADO** (la usa el estudio).
- **`notify-reminders`** — **DESACTIVA "Enforce JWT"** (la llama el cron, no un usuario).

Sube el contenido de `supabase/functions/send-push/index.ts` y
`supabase/functions/notify-reminders/index.ts` respectivamente.

### 6. Programar los recordatorios automáticos

En **Supabase → SQL Editor**, abre `supabase/push-cron.sql`, reemplaza
`TU_PROJECT_REF` y `TU_ANON_KEY` por los tuyos y ejecútalo. Eso hace que
Supabase llame sola a `notify-reminders` cada 30 minutos.

---

## Cómo probar

1. En el celular, instala la app y toca **🔔 Activar notificaciones** → *Permitir*.
2. Desde el panel del estudio, entra a **Recordatorios** y toca
   **🔔 Recordar por notificación** en cualquier alumno con notificaciones activas.
3. Debe llegar la notificación al celular (aunque la app esté cerrada).

Para probar los recordatorios automáticos sin esperar, puedes ejecutar la
función `notify-reminders` manualmente desde el panel de Supabase (botón
"Invoke") o crear una reserva para una clase dentro de las próximas 24 h.

---

## Notas

- Cada recordatorio automático se envía **una sola vez** por alumno (se registra
  en `push_sent_log`), así no se repite.
- Si un alumno desinstala o bloquea las notificaciones, su suscripción caducada
  se borra sola la próxima vez que se intenta enviar.
- El service worker (`public/sw.js`) ya trae el manejo de `push` y del clic en
  la notificación (abre la app en la sección indicada).
