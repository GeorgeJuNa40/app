import { useEffect, useState } from 'react';
import Logo from './Logo';

// Pantalla de presentación: aparece primero al abrir la app, muestra el logo
// animado sobre el fondo forest y luego se desvanece revelando la app.
export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const holdMs = reduce ? 600 : 2200; // tiempo visible antes de salir
    const t1 = window.setTimeout(() => setLeaving(true), holdMs);
    const t2 = window.setTimeout(onDone, holdMs + 620); // + duración del fade-out
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [onDone]);

  const skip = () => setLeaving(true);

  return (
    <div
      className={`mya-splash ${leaving ? 'mya-splash--leaving' : ''}`}
      onClick={skip}
      role="img"
      aria-label="Move yA"
    >
      <div className="mya-splash__inner">
        <Logo height={110} theme="onDark" animated />
        <p className="mya-splash__tag">Pilates · Bienestar</p>
      </div>
    </div>
  );
}
