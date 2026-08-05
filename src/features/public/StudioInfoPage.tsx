import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { supabase } from '../../lib/supabase';
import type { Branding, StudioInfoPage } from '../../lib/types';

// Página PÚBLICA (sin iniciar sesión) con la info que el estudio decidió
// compartir. Se abre desde el QR/link de "Página informativa". Al final incluye
// el botón + QR para registrarse en la app.
interface PublicStudio {
  name: string;
  ceuCode: string;
  branding: Branding;
  photos: string[];
}

export default function StudioInfoPage() {
  const { ceu = '' } = useParams();
  const [studio, setStudio] = useState<PublicStudio | null>(null);
  const [loading, setLoading] = useState(true);
  const [regQr, setRegQr] = useState('');

  const origin = window.location.origin;
  const registerLink = `${origin}/#/?ceu=${encodeURIComponent(ceu)}`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc('get_public_studio', { p_ceu: ceu });
      if (cancelled) return;
      setStudio((data as PublicStudio) ?? null);
      setLoading(false);
    })().catch(() => {
      if (!cancelled) {
        setStudio(null);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ceu]);

  useEffect(() => {
    QRCode.toDataURL(registerLink, { width: 320, margin: 1, color: { dark: '#4A5D55', light: '#ffffff' } })
      .then(setRegQr)
      .catch(() => setRegQr(''));
  }, [registerLink]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-cream">
        <div className="text-2xl font-black text-brand animate-pulse">Move yA</div>
      </div>
    );
  }

  if (!studio) {
    return (
      <div className="min-h-screen grid place-items-center bg-cream p-6 text-center">
        <div className="max-w-sm">
          <h1 className="text-xl font-bold text-ink">Estudio no encontrado</h1>
          <p className="mt-2 text-sm text-ink-soft">Revisa el enlace o el código QR.</p>
        </div>
      </div>
    );
  }

  const b = studio.branding ?? ({} as Branding);
  const info: StudioInfoPage = b.infoPage ?? {};
  const primary = b.primaryColor ?? '#4A5D55';
  const cream = b.secondaryColor ?? '#F4F1EA';

  return (
    <div className="min-h-screen" style={{ background: cream }}>
      {/* Encabezado con la marca del estudio */}
      <header className="px-6 py-10 text-center text-white" style={{ background: primary }}>
        {b.logoUrl ? (
          <img src={b.logoUrl} alt={studio.name} className="mx-auto h-14 object-contain" />
        ) : (
          <h1 className="text-3xl font-black" style={{ fontFamily: b.fontFamily }}>
            {b.logoText || studio.name}
          </h1>
        )}
        {info.headline && <p className="mt-2 text-lg opacity-90">{info.headline}</p>}
      </header>

      <main className="mx-auto max-w-2xl px-5 py-8 space-y-6">
        {info.flyerUrl && (
          <img src={info.flyerUrl} alt="Información" className="w-full rounded-2xl border border-black/5" />
        )}

        {info.about && (
          <Section title="Sobre nosotros" text={info.about} primary={primary} />
        )}
        {info.schedule && (
          <Section title="Clases y horarios" text={info.schedule} primary={primary} />
        )}
        {info.hours && <Section title="Horario de atención" text={info.hours} primary={primary} />}
        {info.contact && <Section title="Contacto y ubicación" text={info.contact} primary={primary} />}

        {studio.photos?.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {studio.photos.map((p, i) => (
              <img key={i} src={p} alt="" className="h-28 w-full rounded-xl object-cover" />
            ))}
          </div>
        )}

        {/* Registro a la app */}
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <h2 className="text-lg font-bold" style={{ color: primary }}>
            ¿Quieres reservar tus clases?
          </h2>
          <p className="mt-1 text-sm text-ink-soft">Regístrate en la app de {studio.name}.</p>
          <a
            href={registerLink}
            className="mt-4 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: primary }}
          >
            Registrarme en la app
          </a>
          {regQr && (
            <div className="mt-4 flex flex-col items-center gap-1">
              <img src={regQr} alt="QR de registro" className="h-36 w-36 rounded-xl border border-black/5" />
              <span className="text-xs text-ink-faint">O escanea para registrarte</span>
            </div>
          )}
        </div>

        <p className="pb-4 text-center text-xs text-ink-faint">
          powered by <span className="font-semibold">Move yA</span>
        </p>
      </main>
    </div>
  );
}

function Section({ title, text, primary }: { title: string; text: string; primary: string }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-1.5 font-bold" style={{ color: primary }}>
        {title}
      </h2>
      <p className="whitespace-pre-line text-sm text-ink-soft">{text}</p>
    </section>
  );
}
