import { createClient } from '@supabase/supabase-js';

// Conector a Supabase.
// Las llaves NO se escriben aquí: se leen de variables de entorno
// (archivo .env.local en tu máquina, o la configuración de Vercel al publicar).
//   VITE_SUPABASE_URL       -> Project URL (https://xxxx.supabase.co)
//   VITE_SUPABASE_ANON_KEY  -> llave "anon public" (segura para el navegador)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Si faltan las llaves, muestra un mensaje claro en pantalla en lugar de
// dejar todo en blanco (que confunde). Así se sabe exactamente qué hacer.
if (!isSupabaseConfigured && typeof document !== 'undefined') {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="min-height:100vh;display:grid;place-items:center;background:#F4F1EA;
                  font-family:system-ui,sans-serif;padding:24px;text-align:center">
        <div style="max-width:460px">
          <h1 style="color:#2D5A4C;font-size:28px;margin:0 0 12px">Move yA</h1>
          <p style="color:#333;font-size:16px;line-height:1.5">
            Falta configurar las llaves de conexión en Vercel.
          </p>
          <p style="color:#555;font-size:14px;line-height:1.6;margin-top:12px">
            En Vercel → <b>Settings → Environment Variables</b>, agrega
            <b>VITE_SUPABASE_URL</b> y <b>VITE_SUPABASE_ANON_KEY</b>,
            y luego vuelve a publicar (<b>Redeploy</b>).
          </p>
        </div>
      </div>`;
  }
}

// URL de reserva bien formada para no romper la app si faltan las llaves
// (en ese caso ya se mostró el mensaje de arriba).
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
