import { createClient } from '@supabase/supabase-js';

// Conector a Supabase.
// Las llaves se leen de variables de entorno (Vercel: Settings → Environment
// Variables, o .env.local en tu máquina):
//   VITE_SUPABASE_URL       -> Project URL (https://xxxx.supabase.co)
//   VITE_SUPABASE_ANON_KEY  -> llave "anon public" (segura para el navegador)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// La app usa esto para avisar de forma clara si faltan las llaves (ver App.tsx).
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error(
    'Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. ' +
      'Configúralas en Vercel (Settings → Environment Variables) y vuelve a publicar.',
  );
}

// URL de reserva bien formada para no romper la carga si faltan las llaves.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true, // mantiene la sesión iniciada al recargar
      autoRefreshToken: true,
    },
  },
);
