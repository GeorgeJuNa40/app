import { createClient } from '@supabase/supabase-js';

// Conector a Supabase.
// Las llaves NO se escriben aquí: se leen de variables de entorno
// (archivo .env.local en tu máquina, o la configuración de Vercel al publicar).
//   VITE_SUPABASE_URL       -> Project URL (https://xxxx.supabase.co)
//   VITE_SUPABASE_ANON_KEY  -> llave "anon public" (segura para el navegador)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Aviso claro si faltan las llaves (evita errores confusos más adelante).
  console.error(
    'Faltan las variables VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. ' +
      'Configúralas en .env.local (local) o en Vercel (producción).'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    persistSession: true, // mantiene la sesión iniciada al recargar
    autoRefreshToken: true,
  },
});
