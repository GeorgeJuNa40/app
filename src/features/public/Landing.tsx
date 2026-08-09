import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { PLANS, PROMO_PRICE, PROMO_TRIAL_DAYS, FOUNDER_PRICE_USD } from '../../lib/plans';

// Landing pública (cara comercial) — estilo cinematográfico + gamificado.
// Vive en el dominio, sin login. Los botones llevan al registro real; los links
// de invitación con ?ceu= NO pasan por aquí (App.tsx los manda al onboarding).

const REGISTRO = '/entrar?nuevo=1';
const LOGIN = '/entrar';

function Lotus({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 512 512" style={style} aria-hidden="true">
      <rect width="512" height="512" rx="120" fill="#4A5D55" />
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
  { ic: '▦', t: 'Reservas en línea', d: 'Tus alumnos agendan y cancelan solos; tú ves el cupo en tiempo real.' },
  { ic: '◈', t: 'Cobros con tarjeta', d: 'Vende paquetes y recibe el dinero directo en tu cuenta. Sin apps aparte.' },
  { ic: '✆', t: 'Recordatorios WhatsApp', d: 'Menos ausencias: la app recuerda la clase y avisa paquetes por vencer.' },
  { ic: '❏', t: 'Paquetes y créditos', d: 'Clases restantes y vigencias bajo control, sin cuentas a mano.' },
  { ic: '★', t: 'Recompensas y metas', d: 'Estrellas por asistir y metas que la app califica sola. Regresan más.' },
  { ic: '▤', t: 'Reportes claros', d: 'Ingresos y asistencia mes con mes. Sabes cómo va tu estudio de un vistazo.' },
];

const STEPS = [
  { n: '1', t: 'Crea tu estudio', d: 'Te registras en 2 minutos y pones tu marca, clases y paquetes.' },
  { n: '2', t: 'Invita a tus alumnos', d: 'Comparte tu código o QR. Reservan y pagan desde su celular.' },
  { n: '3', t: 'Llena tus clases', d: 'La app cobra, recuerda y fideliza por ti. Tú das clase.' },
];

const STAR_GOAL = 8;

export default function Landing() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const device = useRef<HTMLDivElement>(null);
  const [stars, setStars] = useState(0);

  // Programa Fundador: abierto mientras queden lugares; al llenarse la barra
  // cambia sola a la promo de $1 · 14 días.
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
    return () => { alive = false; };
  }, []);
  const founderOpen = founders ? founders.taken < founders.limit : true;
  const remaining = founders ? Math.max(0, founders.limit - founders.taken) : null;

  // Efectos: partículas de fondo, inclinación 3D, reveal al hacer scroll y conteo.
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scope = root.current;
    if (!scope) return;

    // Partículas
    let raf = 0;
    const cv = canvas.current;
    const cx = cv?.getContext('2d');
    let W = 0, H = 0, ps: { x: number; y: number; r: number; s: number; a: number }[] = [];
    const resize = () => {
      if (!cv) return;
      W = cv.width = document.documentElement.clientWidth;
      H = cv.height = window.innerHeight;
      const n = W < 720 ? 26 : 52;
      ps = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.6 + 0.4, s: Math.random() * 0.25 + 0.05, a: Math.random() * 0.5 + 0.2,
      }));
    };
    if (cv && cx && !reduce) {
      resize();
      window.addEventListener('resize', resize);
      const loop = () => {
        cx.clearRect(0, 0, W, H);
        for (const p of ps) {
          p.y -= p.s; if (p.y < -4) p.y = H + 4;
          cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 7);
          cx.fillStyle = `rgba(174,218,213,${p.a})`; cx.fill();
        }
        raf = requestAnimationFrame(loop);
      };
      loop();
    }

    // Inclinación 3D (solo con mouse fino)
    const dev = device.current;
    const onMove = (e: PointerEvent) => {
      if (!dev) return;
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      dev.style.transform = `rotateY(${-16 + x * 14}deg) rotateX(${6 - y * 12}deg)`;
    };
    const fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    if (fine && !reduce) window.addEventListener('pointermove', onMove);

    // Reveal + conteo
    const io = new IntersectionObserver((es) => {
      es.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        const el = en.target as HTMLElement;
        if (el.dataset.count) {
          const to = +el.dataset.count; const pre = el.dataset.pre ?? '';
          let i = 0; const step = () => {
            i++; el.textContent = pre + (i >= to ? to : i);
            if (i < to) setTimeout(step, 700 / Math.max(to, 1));
          };
          step();
        }
        io.unobserve(en.target);
      });
    }, { threshold: 0.2 });
    scope.querySelectorAll('.reveal, [data-count]').forEach((e) => io.observe(e));

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      io.disconnect();
    };
  }, []);

  return (
    <div className="mya-land" ref={root}>
      <div className="bg"><div className="sky" /><div className="aurora" /><canvas id="stars" ref={canvas} /></div>

      <nav>
        <div className="wrap navin">
          <div className="brand"><Lotus /><span>Move yA</span></div>
          <div className="navbtns">
            <Link className="btn btn-ghost" to={LOGIN}>Entrar</Link>
            <Link className="btn btn-primary" to={REGISTRO}>Prueba ${PROMO_PRICE}</Link>
          </div>
        </div>
      </nav>

      <div className="promo">
        {founderOpen ? (
          <>
            <span className="chip">Programa Fundador</span> Los primeros 10 estudios conservan Premium a{' '}
            <b>${FOUNDER_PRICE_USD}/mes de por vida</b>{remaining !== null && <> · <b>quedan {remaining} de 10</b></>}.{' '}
            <Link to={REGISTRO}>Apartar mi lugar →</Link>
          </>
        ) : (
          <>
            <span className="chip">Oferta</span> Prueba Move yA completo por <b>${PROMO_PRICE}</b> · {PROMO_TRIAL_DAYS} días con acceso Premium.{' '}
            <Link to={REGISTRO}>Empezar →</Link>
          </>
        )}
      </div>

      <header className="wrap hero">
        <div>
          <span className="eyebrow"><span className="pulse" /> Para estudios y espacios de bienestar</span>
          <h1>Tu estudio,<br /><span className="grad">en su mejor forma.</span></h1>
          <p className="sub">Reservas, pagos con tarjeta, paquetes y recordatorios por WhatsApp — en una sola app con la cara de tu marca. Menos caos, más clases llenas.</p>
          <div className="cta">
            <Link className="btn btn-primary" to={REGISTRO}>Empieza por ${PROMO_PRICE} · {PROMO_TRIAL_DAYS} días</Link>
            <a className="btn btn-ghost" href="#como">Ver cómo funciona</a>
          </div>
          <div className="reassure">
            <span><span className="dot">◆</span> Sin permanencia</span>
            <span><span className="dot">◆</span> Cancela cuando quieras</span>
            <span><span className="dot">◆</span> Acceso Premium en la prueba</span>
          </div>
        </div>
        <div className="stage">
          <div className="device" ref={device}>
            <div className="glass">
              <div className="dev-top"><b>Estudio Aurora</b><span className="dev-badge">Hoy</span></div>
              <div className="stats">
                <div className="stat"><b>128</b><span>Alumnos</span></div>
                <div className="stat"><b>34</b><span>Reservas</span></div>
                <div className="stat"><b>$18k</b><span>Ingresos</span></div>
              </div>
              <div className="rows">
                <div className="row"><div className="l"><span className="t">07:00</span><span className="c">Reformer</span></div><span className="tag full">Lleno</span></div>
                <div className="row"><div className="l"><span className="t">09:30</span><span className="c">Vinyasa Yoga</span></div><span className="tag few">6/10</span></div>
                <div className="row"><div className="l"><span className="t">18:00</span><span className="c">Barre</span></div><span className="tag few">8/10</span></div>
              </div>
              <div className="wa">✆ Recordatorio enviado a 12 alumnos por WhatsApp</div>
            </div>
            <div className="floaty" style={{ top: '-14px', right: '-10px' }}>★ +1 estrella</div>
            <div className="floaty" style={{ bottom: '24px', left: '-24px', animationDelay: '1.5s' }}>$ Pago recibido</div>
          </div>
        </div>
      </header>

      <section>
        <div className="wrap center reveal">
          <h2>Una plataforma, muchas disciplinas</h2>
          <p className="lead">Si en tu espacio se dan clases con horario y cupo, Move yA es para ti.</p>
          <div className="disc">
            <span><b>Pilates</b> (reformer, mat, todos)</span>
            <span>Yoga</span><span>Barre</span><span>Gimnasios boutique</span><span>Disciplinas de bienestar</span>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="center reveal"><h2>Todo tu estudio, en un solo lugar</h2><p className="lead">Sin juntar cinco herramientas ni pelear con hojas de cálculo.</p></div>
          <div className="grid3">
            {FEATURES.map((f) => (
              <div className="feat reveal" key={f.t}>
                <div className="ic">{f.ic}</div><h3>{f.t}</h3><p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="wrap game reveal">
          <div>
            <h2>Gamificación que llena clases</h2>
            <p className="lead">Move yA premia la constancia: tus alumnos ganan estrellas por asistir y persiguen metas. Pruébalo 👉</p>
            <div className="kpis">
              <div className="kpi"><b data-count={PROMO_PRICE} data-pre="$">${PROMO_PRICE}</b><span>Primer mes</span></div>
              <div className="kpi"><b data-count={PROMO_TRIAL_DAYS}>{PROMO_TRIAL_DAYS}</b><span>Días Premium</span></div>
              <div className="kpi"><b data-count="10">10</b><span>Lugares Fundador</span></div>
            </div>
          </div>
          <div className="starcard">
            <div className="ring" style={{ '--p': (stars / STAR_GOAL) * 100 } as React.CSSProperties}>
              <div className="rin"><div><div className="n">{stars}</div><small>/ {STAR_GOAL} clases</small></div></div>
            </div>
            <button className="btn btn-primary starbtn" type="button" onClick={() => setStars((s) => Math.min(STAR_GOAL, s + 1))}>
              ★ Asistí a una clase
            </button>
            <div className="win">{stars >= STAR_GOAL ? '¡Meta lograda! +5 ★' : ''}</div>
          </div>
        </div>
      </section>

      <section id="como">
        <div className="wrap">
          <div className="center reveal"><h2>De 0 a tu estudio en la nube</h2><p className="lead">Tres pasos, sin instalar nada.</p></div>
          <div className="steps">
            {STEPS.map((s) => (
              <div className="step reveal" key={s.n}><div className="n">{s.n}</div><h3>{s.t}</h3><p>{s.d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section id="precios">
        <div className="wrap">
          <div className="center reveal">
            <h2>Precios simples, sin letras chiquitas</h2>
            <p className="lead">Empieza por <b style={{ color: 'var(--mint)' }}>${PROMO_PRICE}</b> con {PROMO_TRIAL_DAYS} días de acceso <b style={{ color: 'var(--mint)' }}>Premium</b>. Si no te suma, cancelas.</p>
          </div>
          <div className="prices">
            {PLANS.map((p) => (
              <div className={`price reveal${p.highlight ? ' hi' : ''}`} key={p.id}>
                {p.highlight && <div className="badge">Más elegido</div>}
                <div className="pn">{p.name}</div>
                <div className="tl">{p.tagline}</div>
                <div className="amt">${p.priceUsd}<small> USD/mes</small></div>
                <ul>
                  {p.features.slice(0, 5).map((f) => (
                    <li key={f}><span className="ck">✓</span> {f}</li>
                  ))}
                </ul>
                <Link className={`btn ${p.highlight ? 'btn-primary' : 'btn-ghost'}`} to={REGISTRO}>Empezar por ${PROMO_PRICE}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="final">
        <div className="finalbox reveal">
          <h2>Tu próxima clase llena empieza hoy</h2>
          <p className="lead" style={{ marginTop: 14 }}>Prueba Move yA completo por ${PROMO_PRICE} · {PROMO_TRIAL_DAYS} días con acceso Premium. Con tu marca desde el primer día.</p>
          <Link className="btn btn-primary" style={{ marginTop: 26, padding: '16px 30px', fontSize: 16 }} to={REGISTRO}>Crear mi estudio</Link>
        </div>
      </div>

      <footer>
        <div className="wrap footin">
          <div className="brand"><Lotus style={{ width: 26, height: 26 }} /><span>Move yA</span></div>
          <div>
            <a href="#precios">Precios</a>
            <Link to="/privacy">Privacidad</Link>
            <Link to="/terms">Términos</Link>
            <Link to={LOGIN}>Iniciar sesión</Link>
          </div>
        </div>
      </footer>

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
@property --p{syntax:'<number>';inherits:false;initial-value:0}
.mya-land{
  --bg0:#080D0B;--bg1:#0C1512;--bg2:#0F1B17;
  --panel:rgba(255,255,255,.055);--panelb:rgba(174,218,213,.16);
  --mint:#AEDAD5;--mint2:#88B8B7;--sage:#7FB2AF;--cream:#F4F1EA;--muted:#9DB1AB;
  --glow:rgba(136,184,183,.5);
  --font:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  --mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
  position:relative;width:100%;min-height:100vh;overflow-x:hidden;
  background:var(--bg0);color:var(--cream);font-family:var(--font);-webkit-font-smoothing:antialiased;
}
.mya-land *{box-sizing:border-box}
.mya-land a{color:inherit;text-decoration:none}
.mya-land .wrap{max-width:1120px;margin:0 auto;padding:0 22px;position:relative;z-index:2}
.mya-land .bg{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none}
.mya-land .sky{position:absolute;inset:0;background:
  radial-gradient(1200px 700px at 78% -8%, rgba(136,184,183,.28), transparent 60%),
  radial-gradient(900px 640px at 8% 12%, rgba(74,93,85,.42), transparent 62%),
  radial-gradient(1000px 720px at 50% 118%, rgba(127,178,175,.20), transparent 60%),
  linear-gradient(180deg,var(--bg0),var(--bg1) 40%,var(--bg2))}
.mya-land .aurora{position:absolute;inset:-20%;filter:blur(60px);opacity:.5;
  background:radial-gradient(420px 320px at 30% 40%, rgba(174,218,213,.30), transparent 70%),
   radial-gradient(460px 360px at 70% 60%, rgba(127,178,175,.26), transparent 70%);
  animation:mya-drift 18s ease-in-out infinite alternate}
@keyframes mya-drift{0%{transform:translate3d(-3%,-2%,0) scale(1)}100%{transform:translate3d(4%,3%,0) scale(1.12)}}
.mya-land canvas#stars{position:absolute;inset:0}
.mya-land nav{position:sticky;top:0;z-index:20;backdrop-filter:blur(10px);background:linear-gradient(180deg,rgba(8,13,11,.72),rgba(8,13,11,.25));border-bottom:1px solid rgba(255,255,255,.06)}
.mya-land .navin{display:flex;align-items:center;justify-content:space-between;padding:14px 22px}
.mya-land .brand{display:flex;align-items:center;gap:10px;font-weight:800;letter-spacing:-.01em;min-width:0}
.mya-land .brand svg{width:34px;height:34px;border-radius:11px;box-shadow:0 6px 18px -6px var(--glow);flex:none}
.mya-land .brand span{white-space:nowrap}
.mya-land .navbtns{display:flex;gap:10px;align-items:center;flex-shrink:0}
.mya-land .btn{border-radius:999px;padding:11px 20px;font-weight:700;font-size:14px;cursor:pointer;border:1px solid transparent;transition:transform .15s, box-shadow .25s, background .2s;display:inline-flex;align-items:center;gap:8px;white-space:nowrap}
.mya-land .btn:active{transform:translateY(1px)}
.mya-land .btn-ghost{color:var(--cream);border-color:rgba(255,255,255,.16);background:rgba(255,255,255,.03)}
.mya-land .btn-ghost:hover{border-color:var(--mint)}
.mya-land .btn-primary{color:#0A100E;background:linear-gradient(180deg,#CDEBE6,var(--mint2));box-shadow:0 10px 30px -8px var(--glow), inset 0 1px 0 rgba(255,255,255,.5);position:relative;overflow:hidden}
.mya-land .btn-primary:hover{box-shadow:0 16px 42px -8px var(--glow)}
.mya-land .btn-primary::after{content:"";position:absolute;top:0;left:-120%;width:60%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.65),transparent);transform:skewX(-18deg);animation:mya-sheen 4.5s ease-in-out infinite}
@keyframes mya-sheen{0%,60%{left:-120%}80%,100%{left:130%}}
.mya-land .promo{position:relative;z-index:2;text-align:center;font-size:13.5px;padding:9px 16px;background:linear-gradient(90deg,rgba(174,218,213,.14),rgba(127,178,175,.10));border-bottom:1px solid rgba(174,218,213,.14)}
.mya-land .promo .chip{display:inline-block;background:var(--mint);color:#0A100E;font-weight:800;font-size:11px;padding:3px 9px;border-radius:999px;margin-right:8px;text-transform:uppercase;letter-spacing:.04em}
.mya-land .promo b{color:var(--mint)}
.mya-land .promo a{font-weight:800;color:var(--mint);text-decoration:underline;text-underline-offset:3px}
.mya-land .hero{position:relative;z-index:2;padding:64px 22px 40px;display:grid;grid-template-columns:1.05fr .95fr;gap:40px;align-items:center}
.mya-land .eyebrow{display:inline-flex;align-items:center;gap:9px;font:700 12px/1.3 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--mint);background:rgba(174,218,213,.08);border:1px solid rgba(174,218,213,.18);padding:8px 13px;border-radius:16px;max-width:100%;white-space:normal}
.mya-land .eyebrow .pulse{width:7px;height:7px;border-radius:50%;background:var(--mint);flex:none;animation:mya-pp 2s infinite}
@keyframes mya-pp{0%{box-shadow:0 0 0 0 rgba(136,184,183,.6)}70%{box-shadow:0 0 0 9px rgba(136,184,183,0)}100%{box-shadow:0 0 0 0 rgba(136,184,183,0)}}
.mya-land h1{font-size:clamp(38px,6.4vw,68px);line-height:1.02;letter-spacing:-.035em;font-weight:900;margin:22px 0 0;text-wrap:balance}
.mya-land h1 .grad{background:linear-gradient(120deg,#EAF6F3,var(--mint) 55%,var(--sage));-webkit-background-clip:text;background-clip:text;color:transparent}
.mya-land .sub{margin:20px 0 0;font-size:18px;line-height:1.6;color:#C7D6D1;max-width:30em}
.mya-land .cta{margin-top:30px;display:flex;gap:14px;flex-wrap:wrap}
.mya-land .cta .btn{padding:15px 26px;font-size:16px}
.mya-land .reassure{margin-top:16px;font-size:13.5px;color:var(--muted);display:flex;gap:16px;flex-wrap:wrap}
.mya-land .reassure span{display:inline-flex;gap:7px;align-items:center}
.mya-land .reassure .dot{color:var(--mint)}
.mya-land .stage{perspective:1200px;display:flex;justify-content:center}
.mya-land .device{width:330px;max-width:88vw;transform-style:preserve-3d;transform:rotateY(-16deg) rotateX(6deg);transition:transform .2s ease-out;animation:mya-float 7s ease-in-out infinite;position:relative}
@keyframes mya-float{0%,100%{translate:0 -8px}50%{translate:0 8px}}
.mya-land .glass{background:linear-gradient(160deg,rgba(255,255,255,.10),rgba(255,255,255,.03));border:1px solid var(--panelb);border-radius:26px;padding:16px;box-shadow:0 40px 80px -30px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.14);backdrop-filter:blur(10px)}
.mya-land .dev-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.mya-land .dev-top b{font-size:14px}
.mya-land .dev-badge{font-size:11px;font-weight:700;background:rgba(174,218,213,.16);color:var(--mint);padding:4px 9px;border-radius:999px}
.mya-land .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}
.mya-land .stat{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:10px;text-align:center}
.mya-land .stat b{display:block;font-size:18px;color:#EAF6F3;font-weight:900}
.mya-land .stat span{font-size:10.5px;color:var(--muted)}
.mya-land .rows{display:flex;flex-direction:column;gap:8px}
.mya-land .row{display:flex;align-items:center;justify-content:space-between;gap:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:9px 11px}
.mya-land .row .l{display:flex;gap:10px;align-items:center}
.mya-land .row .t{font:800 13px var(--mono);color:var(--mint)}
.mya-land .row .c{font-size:13px}
.mya-land .tag{font-size:10.5px;font-weight:800;padding:3px 8px;border-radius:999px;white-space:nowrap}
.mya-land .tag.full{background:var(--mint);color:#0A100E}
.mya-land .tag.few{background:rgba(174,218,213,.16);color:var(--mint)}
.mya-land .wa{margin-top:12px;display:flex;gap:9px;align-items:center;background:rgba(127,178,175,.12);border:1px solid rgba(174,218,213,.14);border-radius:14px;padding:10px 11px;font-size:12px;color:#Cfe}
.mya-land .floaty{position:absolute;font:800 12px var(--mono);color:#0A100E;background:var(--mint);padding:7px 11px;border-radius:12px;box-shadow:0 12px 26px -10px var(--glow);animation:mya-float 6s ease-in-out infinite}
.mya-land section{position:relative;z-index:2;padding:70px 0}
.mya-land .center{text-align:center;max-width:640px;margin:0 auto}
.mya-land h2{font-size:clamp(26px,4vw,40px);letter-spacing:-.025em;font-weight:900;margin:0;text-wrap:balance}
.mya-land .lead{color:#B9CBC5;margin-top:12px;font-size:16px}
.mya-land .reveal{opacity:0;transform:translateY(26px);transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1)}
.mya-land .reveal.in{opacity:1;transform:none}
.mya-land .disc{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:26px}
.mya-land .disc span{font-size:14px;font-weight:600;color:#DDE9E5;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);padding:9px 15px;border-radius:999px;min-width:0}
.mya-land .disc b{color:var(--mint)}
.mya-land .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:44px}
.mya-land .feat{background:var(--panel);border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:24px;transition:transform .25s, border-color .25s, box-shadow .25s;min-width:0}
.mya-land .feat:hover{transform:translateY(-6px);border-color:var(--panelb);box-shadow:0 30px 60px -30px rgba(0,0,0,.6)}
.mya-land .feat .ic{width:46px;height:46px;display:grid;place-items:center;border-radius:14px;font-size:20px;background:linear-gradient(160deg,rgba(174,218,213,.22),rgba(127,178,175,.10));color:var(--mint);box-shadow:inset 0 1px 0 rgba(255,255,255,.15)}
.mya-land .feat h3{margin:16px 0 6px;font-size:18px}
.mya-land .feat p{margin:0;color:#B4C6C1;font-size:14.5px;line-height:1.55}
.mya-land .game{display:grid;grid-template-columns:1.1fr .9fr;gap:34px;align-items:center;background:linear-gradient(160deg,rgba(174,218,213,.10),rgba(127,178,175,.04));border:1px solid var(--panelb);border-radius:28px;padding:36px}
.mya-land .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:22px}
.mya-land .kpi{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:16px;text-align:center;min-width:0}
.mya-land .kpi b{display:block;font-size:32px;font-weight:900;color:#EAF6F3;font-variant-numeric:tabular-nums}
.mya-land .kpi span{font-size:12px;color:var(--muted)}
.mya-land .starcard{background:rgba(10,16,14,.5);border:1px solid var(--panelb);border-radius:22px;padding:22px;text-align:center}
.mya-land .ring{width:132px;height:132px;border-radius:50%;margin:6px auto 0;display:grid;place-items:center;background:conic-gradient(var(--mint) calc(var(--p)*1%), rgba(255,255,255,.08) 0);transition:--p .5s}
.mya-land .ring .rin{width:104px;height:104px;border-radius:50%;background:#0C1512;display:grid;place-items:center}
.mya-land .ring .n{font-size:30px;font-weight:900;color:var(--mint)}
.mya-land .ring small{font-size:11px;color:var(--muted)}
.mya-land .starbtn{margin-top:16px}
.mya-land .win{color:var(--mint);font-weight:800;margin-top:10px;min-height:20px}
.mya-land .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:44px}
.mya-land .step{position:relative;background:var(--panel);border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:26px;min-width:0}
.mya-land .step .n{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-weight:900;color:#0A100E;background:linear-gradient(180deg,#CDEBE6,var(--mint2));box-shadow:0 10px 24px -10px var(--glow)}
.mya-land .step h3{margin:16px 0 6px;font-size:18px}
.mya-land .step p{margin:0;color:#B4C6C1;font-size:14.5px}
.mya-land .prices{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:44px;align-items:stretch}
.mya-land .price{display:flex;flex-direction:column;background:var(--panel);border:1px solid rgba(255,255,255,.09);border-radius:24px;padding:28px;position:relative;transition:transform .25s;min-width:0}
.mya-land .price:hover{transform:translateY(-6px)}
.mya-land .price.hi{border-color:var(--mint);box-shadow:0 30px 70px -30px var(--glow), inset 0 1px 0 rgba(255,255,255,.12);background:linear-gradient(180deg,rgba(174,218,213,.10),rgba(255,255,255,.03))}
.mya-land .price .badge{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--mint);color:#0A100E;font-weight:800;font-size:12px;padding:5px 14px;border-radius:999px;white-space:nowrap}
.mya-land .price .pn{color:var(--mint);font-weight:900;font-size:20px}
.mya-land .price .tl{color:var(--muted);font-size:13px;margin-top:2px}
.mya-land .price .amt{margin:16px 0 2px;font-size:44px;font-weight:900;color:#EAF6F3}
.mya-land .price .amt small{font-size:14px;color:var(--muted);font-weight:600}
.mya-land .price ul{list-style:none;margin:16px 0 0;padding:0;display:grid;gap:10px;flex:1}
.mya-land .price li{display:flex;gap:10px;font-size:13.5px;color:#C7D6D1}
.mya-land .price li .ck{color:var(--mint)}
.mya-land .price .btn{margin-top:22px;justify-content:center}
.mya-land .final{position:relative;z-index:2;text-align:center;padding:26px 22px 84px}
.mya-land .finalbox{max-width:820px;margin:0 auto;background:linear-gradient(160deg,rgba(174,218,213,.14),rgba(127,178,175,.06));border:1px solid var(--panelb);border-radius:32px;padding:56px 26px;box-shadow:0 40px 90px -40px rgba(0,0,0,.6)}
.mya-land footer{position:relative;z-index:2;border-top:1px solid rgba(255,255,255,.07);padding:26px 0;color:var(--muted);font-size:13px}
.mya-land .footin{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px}
.mya-land .footin a{margin-left:18px}
.mya-land .footin>div:first-child a{margin:0}
@media (max-width:860px){
  .mya-land .hero{display:block;padding:40px 22px}
  .mya-land .hero>div{width:100%;min-width:0}
  .mya-land .stage{margin-top:26px}
  .mya-land .sub{max-width:100%}
  .mya-land .game{grid-template-columns:1fr}
  .mya-land .grid3,.mya-land .steps,.mya-land .prices{grid-template-columns:1fr}
  .mya-land .device{transform:rotateY(-8deg) rotateX(4deg)}
}
@media (max-width:520px){
  .mya-land h1{font-size:clamp(33px,10vw,58px)}
  .mya-land .navin{padding:11px 22px}
  .mya-land .brand span{font-size:14px}
  .mya-land .brand svg{width:28px;height:28px}
  .mya-land .navbtns{gap:6px}
  .mya-land .navbtns .btn{padding:8px 11px;font-size:12.5px}
  .mya-land .eyebrow{font-size:10.5px;letter-spacing:.1em}
  .mya-land .promo{font-size:11.5px;padding:8px 14px}
  .mya-land .cta{flex-direction:column}
  .mya-land .cta .btn{width:100%;justify-content:center}
  .mya-land .floaty{display:none}
  .mya-land .device{width:300px}
  .mya-land section{padding:52px 0}
  .mya-land .game{padding:24px}
}
@media (prefers-reduced-motion:reduce){
  .mya-land *{animation:none!important;transition:none!important}
  .mya-land .reveal{opacity:1;transform:none}
}
`;
