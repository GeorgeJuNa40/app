import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { PLANS, PROMO_PRICE, PROMO_TRIAL_DAYS, FOUNDER_PRICE_USD } from '../../lib/plans';

// Landing pública (sin login): la cara comercial de Move yA en el dominio.
// Enfocada en conversión y en celular. Los botones llevan al registro real.
// (Los links de invitación con ?ceu= NO pasan por aquí: App.tsx los manda
// directo al onboarding.)

const REGISTRO = '/entrar?nuevo=1';
const LOGIN = '/entrar';

function Lotus({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <rect width="512" height="512" rx="112" fill="#4A5D55" />
      <g transform="translate(256,356)" stroke="#38473F" strokeWidth="10" strokeLinejoin="round">
        <path d="M0,0 C-66,-66 -68,-150 0,-206 C68,-150 66,-66 0,0 Z" fill="#7FB2AF" transform="rotate(-72) scale(0.9)" />
        <path d="M0,0 C-66,-66 -68,-150 0,-206 C68,-150 66,-66 0,0 Z" fill="#7FB2AF" transform="rotate(72) scale(0.9)" />
        <path d="M0,0 C-62,-70 -58,-162 0,-216 C58,-162 62,-70 0,0 Z" fill="#AEDAD5" transform="rotate(-36) scale(0.96)" />
        <path d="M0,0 C-62,-70 -58,-162 0,-216 C58,-162 62,-70 0,0 Z" fill="#AEDAD5" transform="rotate(36) scale(0.96)" />
        <path d="M0,0 C-58,-74 -54,-178 0,-236 C54,-178 58,-74 0,0 Z" fill="#FAF8F3" />
      </g>
    </svg>
  );
}

const FEATURES = [
  { icon: '▦', title: 'Reservas en línea', text: 'Tus alumnos agendan y cancelan solos. Tú ves todo el calendario y el cupo en tiempo real.' },
  { icon: '◈', title: 'Cobros con tarjeta', text: 'Vende paquetes en línea y recibe el dinero directo en tu cuenta (Stripe). Sin apps aparte.' },
  { icon: '✆', title: 'Recordatorios por WhatsApp', text: 'Menos ausencias: la app recuerda la clase y avisa cuando un paquete está por vencer.' },
  { icon: '❏', title: 'Paquetes y créditos', text: 'Controla clases restantes y vigencias sin hojas de cálculo ni cuentas a mano.' },
  { icon: '★', title: 'Recompensas y metas', text: 'Estrellas por asistir y metas que la app califica sola. Tus alumnos regresan más.' },
  { icon: '▤', title: 'Reportes claros', text: 'Ingresos, asistencia y crecimiento, mes con mes. Sabes cómo va tu estudio de un vistazo.' },
];

const STEPS = [
  { n: '1', title: 'Crea tu estudio', text: 'Te registras en 2 minutos y personalizas tu marca, tus clases y tus paquetes.' },
  { n: '2', title: 'Invita a tus alumnos', text: 'Comparte tu código o QR. Ellos reservan y pagan desde su celular.' },
  { n: '3', title: 'Llena tus clases', text: 'La app cobra, recuerda y fideliza por ti. Tú te dedicas a dar clase.' },
];

export default function Landing() {
  // Programa Fundador: consulta cuántos de los 10 lugares ya se ocuparon.
  // Mientras haya cupo → se promociona Fundador; al llenarse → cambia solo a
  // la promo de $1 · 14 días. Si la función aún no está en Supabase (o falla),
  // se asume abierto (estamos al inicio) y se muestra Fundador sin contador.
  const [founders, setFounders] = useState<{ taken: number; limit: number } | null>(null);
  useEffect(() => {
    let alive = true;
    supabase.rpc('founders_status').then(
      ({ data, error }) => {
        if (!alive || error || !data) return;
        setFounders({ taken: Number(data.taken) || 0, limit: Number(data.limit) || 10 });
      },
      () => {},
    );
    return () => {
      alive = false;
    };
  }, []);
  const founderOpen = founders ? founders.taken < founders.limit : true;
  const remaining = founders ? Math.max(0, founders.limit - founders.taken) : null;

  return (
    <div className="min-h-screen bg-cream-light text-ink font-sans">
      {/* ---------- NAV ---------- */}
      <header className="sticky top-0 z-30 border-b border-cream-dark/70 bg-cream-light/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <Lotus className="h-9 w-9 rounded-xl shadow-soft" />
            <span className="text-lg font-black tracking-tight text-forest">Move yA</span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link to={LOGIN} className="rounded-full px-4 py-2 text-sm font-semibold text-forest hover:bg-cream-dark/60">
              Iniciar sesión
            </Link>
            <Link to={REGISTRO} className="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-cream-light shadow-card hover:bg-forest-dark">
              Prueba por ${PROMO_PRICE}
            </Link>
          </nav>
        </div>
      </header>

      {/* ---------- BARRA DE PROMO (Fundador → $1 automático) ---------- */}
      <div className="bg-forest text-cream-light">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-5 py-2.5 text-center text-sm">
          {founderOpen ? (
            <>
              <span className="rounded-full bg-mint/30 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide">
                Programa Fundador
              </span>
              <span className="font-medium">
                Los primeros 10 estudios conservan Premium a <strong>${FOUNDER_PRICE_USD}/mes de por vida</strong>
                {remaining !== null && (
                  <>
                    {' '}· <strong>quedan {remaining} de 10</strong>
                  </>
                )}
                .
              </span>
              <Link to={REGISTRO} className="font-bold underline underline-offset-2">
                Apartar mi lugar →
              </Link>
            </>
          ) : (
            <>
              <span className="rounded-full bg-mint/30 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide">
                Oferta de lanzamiento
              </span>
              <span className="font-medium">
                Prueba Move yA completo por <strong>${PROMO_PRICE}</strong> · {PROMO_TRIAL_DAYS} días con acceso Premium.
              </span>
              <Link to={REGISTRO} className="font-bold underline underline-offset-2">
                Empezar →
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-mint-soft/50 blur-3xl" />
          <div className="absolute -left-20 top-40 h-72 w-72 rounded-full bg-mint/20 blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-14 lg:grid-cols-2 lg:pt-20">
          <div className="reveal">
            <span className="inline-flex items-center gap-2 rounded-full border border-mint/40 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-forest">
              <span className="h-1.5 w-1.5 rounded-full bg-mint-dark" />
              Software para estudios de Pilates
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl" style={{ textWrap: 'balance' } as React.CSSProperties}>
              Tu estudio,<br />lleno y en orden.
            </h1>
            <p className="mt-5 max-w-md text-lg text-ink-soft">
              Reservas, pagos con tarjeta, paquetes y recordatorios por WhatsApp — todo en una sola app con la cara de tu marca. Deja el Excel y las libretas.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to={REGISTRO} className="rounded-full bg-forest px-7 py-3.5 text-center text-base font-bold text-cream-light shadow-zen transition hover:bg-forest-dark">
                Empieza por ${PROMO_PRICE} · {PROMO_TRIAL_DAYS} días
              </Link>
              <a href="#como" className="rounded-full border border-cream-dark bg-white px-7 py-3.5 text-center text-base font-semibold text-forest transition hover:border-mint">
                Ver cómo funciona
              </a>
            </div>
            <p className="mt-4 text-sm text-ink-faint">
              Sin permanencia · Cancela cuando quieras · Acceso Premium durante la prueba
            </p>
          </div>

          {/* Mock del panel — hecho con CSS, ligero y sin imágenes externas */}
          <div className="reveal reveal-2 relative mx-auto w-full max-w-sm">
            <div className="rounded-3xl border border-cream-dark bg-white p-5 shadow-zen">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lotus className="h-7 w-7 rounded-lg" />
                  <span className="text-sm font-bold text-forest">Estudio Aurora</span>
                </div>
                <span className="rounded-full bg-mint-soft/60 px-2.5 py-1 text-[11px] font-semibold text-forest">Hoy</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[['Alumnos', '128'], ['Reservas', '34'], ['Ingresos', '$18k']].map(([k, v]) => (
                  <div key={k} className="rounded-2xl bg-cream-light p-3 text-center">
                    <div className="text-lg font-black text-forest">{v}</div>
                    <div className="text-[11px] text-ink-faint">{k}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {[['07:00', 'Reformer', 'Lleno'], ['09:30', 'Mat Flow', '6/10'], ['18:00', 'Barre', '8/10']].map(([h, c, s]) => (
                  <div key={h} className="flex items-center justify-between rounded-2xl border border-cream-dark px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold tabular-nums text-forest">{h}</span>
                      <span className="text-sm font-medium text-ink">{c}</span>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s === 'Lleno' ? 'bg-forest text-cream-light' : 'bg-mint-soft/60 text-forest'}`}>{s}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-mint-soft/40 px-3 py-2.5">
                <span className="text-forest">✆</span>
                <span className="text-xs text-ink-soft">Recordatorio enviado a 12 alumnos por WhatsApp</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- TIRA DE CONFIANZA ---------- */}
      <div className="border-y border-cream-dark/60 bg-white/60">
        <p className="mx-auto max-w-6xl px-5 py-4 text-center text-sm font-medium text-ink-faint">
          Hecho para estudios de <span className="text-forest">Pilates</span>, <span className="text-forest">Yoga</span> y <span className="text-forest">fitness boutique</span> · en español · pensado para México
        </p>
      </div>

      {/* ---------- FEATURES ---------- */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-black tracking-tight text-ink sm:text-4xl" style={{ textWrap: 'balance' } as React.CSSProperties}>
            Todo lo que tu estudio necesita, en un solo lugar
          </h2>
          <p className="mt-3 text-ink-soft">Sin juntar cinco herramientas ni pelear con hojas de cálculo.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-3xl border border-cream-dark bg-white p-6 shadow-soft transition hover:shadow-card">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-mint-soft/50 text-xl text-forest">{f.icon}</div>
              <h3 className="mt-4 text-lg font-bold text-ink">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- CÓMO FUNCIONA ---------- */}
      <section id="como" className="bg-white/60 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">De 0 a tu estudio en la nube</h2>
            <p className="mt-3 text-ink-soft">Tres pasos. Sin instalar nada, sin complicaciones.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="relative rounded-3xl border border-cream-dark bg-cream-light p-7">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-forest text-lg font-black text-cream-light">{s.n}</div>
                <h3 className="mt-4 text-lg font-bold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- PRECIOS ---------- */}
      <section id="precios" className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">Precios simples, sin letras chiquitas</h2>
          <p className="mt-3 text-ink-soft">
            Empieza por <span className="font-bold text-forest">${PROMO_PRICE}</span> con {PROMO_TRIAL_DAYS} días de acceso <span className="font-bold text-forest">Premium</span>. Si no te suma, cancelas y ya.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-3xl border bg-white p-7 ${p.highlight ? 'border-forest shadow-zen lg:-translate-y-2' : 'border-cream-dark shadow-soft'}`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-forest px-3 py-1 text-xs font-bold text-cream-light">
                  Más elegido
                </span>
              )}
              <h3 className="text-xl font-black text-forest">{p.name}</h3>
              <p className="mt-1 text-sm text-ink-faint">{p.tagline}</p>
              <div className="mt-5 flex items-end gap-1.5">
                <span className="text-4xl font-black text-ink">${p.priceUsd}</span>
                <span className="mb-1.5 text-sm text-ink-faint">USD / mes</span>
              </div>
              <ul className="mt-6 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-ink-soft">
                    <span className="mt-0.5 text-mint-dark">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={REGISTRO}
                className={`mt-7 rounded-full px-6 py-3 text-center text-sm font-bold transition ${p.highlight ? 'bg-forest text-cream-light hover:bg-forest-dark' : 'border border-cream-dark text-forest hover:border-mint'}`}
              >
                Empezar por ${PROMO_PRICE}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- CTA FINAL ---------- */}
      <section className="px-5 pb-20">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-forest px-8 py-14 text-center shadow-zen">
          <h2 className="mx-auto max-w-2xl text-3xl font-black tracking-tight text-cream-light sm:text-4xl" style={{ textWrap: 'balance' } as React.CSSProperties}>
            Tu próxima clase llena empieza hoy
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-cream/80">
            Prueba Move yA completo por ${PROMO_PRICE} · {PROMO_TRIAL_DAYS} días con acceso Premium. Sin permanencia y con tu marca desde el primer día.
          </p>
          <Link to={REGISTRO} className="mt-8 inline-block rounded-full bg-cream-light px-8 py-3.5 text-base font-bold text-forest shadow-card transition hover:bg-white">
            Crear mi estudio
          </Link>
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="border-t border-cream-dark/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <Lotus className="h-7 w-7 rounded-lg" />
            <span className="font-bold text-forest">Move yA</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-soft">
            <a href="#precios" className="hover:text-forest">Precios</a>
            <Link to="/privacy" className="hover:text-forest">Privacidad</Link>
            <Link to="/terms" className="hover:text-forest">Términos</Link>
            <Link to={LOGIN} className="font-semibold text-forest">Iniciar sesión</Link>
          </nav>
        </div>
        <p className="pb-8 text-center text-xs text-ink-faint">© {new Date().getFullYear()} Move yA · Hecho con calma para estudios que crecen.</p>
      </footer>

      <style>{`
        .reveal { opacity: 0; transform: translateY(14px); animation: rise .7s cubic-bezier(.2,.7,.2,1) forwards; }
        .reveal-2 { animation-delay: .12s; }
        @keyframes rise { to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .reveal { animation: none; opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
