import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../lib/store';
import type { Role } from '../../lib/types';
import Logo from '../../components/Logo';

// Pantalla de inicio: video de marca (logo animado) + input único de CEU,
// luego selección de rol para el login del MVP.
export default function OnboardingScreen() {
  const { db, loginWithCeu, resetDemoData } = useStore();
  const navigate = useNavigate();
  const [ceu, setCeu] = useState('');
  const [validStudio, setValidStudio] = useState<string | null>(null);
  const [error, setError] = useState('');

  const checkCeu = (e: React.FormEvent) => {
    e.preventDefault();
    const studio = db.studios.find(
      (s) => s.ceuCode.toUpperCase() === ceu.trim().toUpperCase(),
    );
    if (!studio) {
      setError('Código de Estudio no encontrado. Prueba con ZEN-2024.');
      setValidStudio(null);
      return;
    }
    setError('');
    setValidStudio(studio.name);
  };

  const enterAs = (role: Role) => {
    const user = loginWithCeu(ceu, role);
    if (!user) {
      setError('No existe un usuario con ese rol en este estudio.');
      return;
    }
    navigate(role === 'STUDIO_ADMIN' ? '/admin' : role === 'COACH' ? '/coach' : '/app');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Panel de marca / "video" */}
      <div className="relative hidden lg:flex flex-col justify-between bg-forest text-cream p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {/* Círculos concéntricos animados que evocan el "video de marca / fluidez" */}
          <div className="brand-pulse absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cream" />
          <div className="brand-pulse absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cream [animation-delay:1s]" />
          <div className="brand-pulse absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cream [animation-delay:2s]" />
        </div>
        <div className="relative">
          <p className="text-sm tracking-[0.3em] uppercase opacity-80">Pilates · Bienestar</p>
        </div>
        <div className="relative text-center">
          <div className="brand-float flex justify-center">
            <Logo height={92} theme="onDark" />
          </div>
          <p className="mt-4 text-cream/80 max-w-sm mx-auto">
            La plataforma que fluye con tu estudio. Reserva, gestiona y crece.
          </p>
        </div>
        <div className="relative text-xs opacity-70">© {new Date().getFullYear()} Move yA</div>
      </div>

      {/* Panel de acceso */}
      <div className="flex items-center justify-center bg-cream p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo height={56} theme="onLight" />
          </div>

          <h1 className="text-2xl font-bold text-ink">Bienvenido</h1>
          <p className="text-ink-faint mt-1 mb-6">
            Ingresa tu <strong>Código de Estudio Único (CEU)</strong> para continuar.
          </p>

          <form onSubmit={checkCeu} className="space-y-3">
            <input
              value={ceu}
              onChange={(e) => {
                setCeu(e.target.value);
                setValidStudio(null);
              }}
              placeholder="Ej. ZEN-2024"
              className="w-full rounded-xl border border-cream-dark bg-white px-4 py-3 text-center text-lg font-semibold tracking-widest uppercase outline-none focus:ring-2 ring-brand"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!validStudio && (
              <button
                type="submit"
                className="w-full rounded-xl bg-brand px-4 py-3 font-semibold text-cream shadow-zen hover:opacity-90"
              >
                Verificar código
              </button>
            )}
          </form>

          {validStudio && (
            <div className="mt-6 animate-[fadeIn_.3s_ease]">
              <div className="rounded-xl bg-white border border-cream-dark p-4 mb-4">
                <p className="text-xs uppercase text-ink-faint">Estudio vinculado</p>
                <p className="font-bold text-brand">{validStudio}</p>
              </div>
              <p className="text-sm text-ink-faint mb-3">
                Selecciona tu rol para acceder (demo):
              </p>
              <div className="space-y-2">
                <RoleButton label="Entrar como Estudio (Admin)" onClick={() => enterAs('STUDIO_ADMIN')} />
                <RoleButton label="Entrar como Coach" onClick={() => enterAs('COACH')} />
                <RoleButton label="Entrar como Alumno" onClick={() => enterAs('STUDENT')} />
              </div>
            </div>
          )}

          <div className="mt-8 rounded-xl bg-cream-dark/50 p-4 text-xs text-ink-soft">
            <p className="font-semibold mb-1">Códigos de demo</p>
            <p>CEU: <code className="font-mono">ZEN-2024</code></p>
            <button
              onClick={resetDemoData}
              className="mt-2 underline text-ink-faint hover:text-ink"
            >
              Reiniciar datos de demostración
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px);} to {opacity:1;transform:none;} }
        @keyframes brandPulse { 0%{transform:translate(-50%,-50%) scale(.8);opacity:.6;} 100%{transform:translate(-50%,-50%) scale(1.15);opacity:0;} }
        @keyframes brandFloat { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-8px);} }
        .brand-pulse{ animation: brandPulse 3s ease-out infinite; }
        .brand-float{ animation: brandFloat 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

function RoleButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-cream-dark bg-white px-4 py-3 text-left font-medium text-ink hover:border-brand hover:bg-cream-dark/40 transition flex items-center justify-between"
    >
      {label}
      <span className="text-brand">→</span>
    </button>
  );
}
