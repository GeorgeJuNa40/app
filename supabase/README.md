# Supabase — Move yA

Orden para configurar la base de datos (correr en el SQL Editor de Supabase):

1. **`schema.sql`** — Crea las 11 tablas y sus relaciones (Paso 2 y 3).
2. **`auth-setup.sql`** — Registro por CEU: crea la ficha del usuario y el estudio
   automáticamente al registrarse (Paso 4).
3. **`rls-policies.sql`** — El "candado de oro": aísla los datos por estudio (Paso 5).

## Variables de entorno de la app

La app se conecta con dos variables (ver `.env.example`):

- `VITE_SUPABASE_URL` — Project URL de Supabase.
- `VITE_SUPABASE_ANON_KEY` — llave pública "anon" (segura para el navegador; RLS
  protege los datos).

En local van en `.env.local`; en Vercel se configuran en **Settings → Environment
Variables**. La llave secreta (`service_role`) nunca va en la app.
