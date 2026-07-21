import { useState } from 'react';
import { useStore } from '../../lib/store';

type Mode = 'login' | 'join' | 'create';

// Pantalla de inicio: registro real (crear estudio o unirse por CEU) e inicio
// de sesión, contra Supabase. La redirección la hace App.tsx según el rol.
export default function OnboardingScreen() {
  const { signIn, signUp } = useStore();
  const [mode, setMode] = useState<Mode>('login');

  const [fullName, setFullName] = useState('');
  const [studioName, setStudioName] = useState('');
  const [ceu, setCeu] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else if (mode === 'create') {
        if (!studioName.trim()) throw new Error('Escribe el nombre de tu estudio.');
        await signUp({ fullName, email, password, studioName });
      } else {
        if (!ceu.trim()) throw new Error('Escribe el Código de Estudio (CEU).');
        await signUp({ fullName, email, password, ceuCode: ceu });
      }
      // Al haber sesión, App.tsx redirige automáticamente al panel según el rol.
    } catch (err) {
      setError(translateError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Panel de marca — solo el logo, limpio */}
      <div className="hidden lg:flex items-center justify-center bg-forest text-cream p-12">
        <div className="brand-float text-6xl font-black tracking-tight">Move yA</div>
      </div>

      {/* Panel de acceso */}
      <div className="flex items-center justify-center bg-cream p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <div className="brand-float text-4xl font-black text-brand">Move yA</div>
          </div>

          <h1 className="text-2xl font-bold text-ink">
            {mode === 'login' ? 'Bienvenido de nuevo' : mode === 'create' ? 'Crea tu estudio' : 'Únete a tu estudio'}
          </h1>
          <p className="text-ink-faint mt-1 mb-6">
            {mode === 'login'
              ? 'Ingresa con tu correo y contraseña.'
              : mode === 'create'
                ? 'Registra tu estudio y empieza tu prueba.'
                : 'Ingresa el Código de Estudio (CEU) que te dieron.'}
          </p>

          <form onSubmit={submit} className="space-y-3">
            {mode !== 'login' && (
              <Input label="Tu nombre" value={fullName} onChange={setFullName} placeholder="Ej. Ana López" required />
            )}
            {mode === 'create' && (
              <Input label="Nombre del estudio" value={studioName} onChange={setStudioName} placeholder="Ej. Estudio Zen" required />
            )}
            {mode === 'join' && (
              <Input
                label="Código de Estudio (CEU)"
                value={ceu}
                onChange={(v) => setCeu(v.toUpperCase())}
                placeholder="Ej. ZEN-2024"
                required
              />
            )}
            <Input label="Correo" type="email" value={email} onChange={setEmail} placeholder="tu@correo.com" required />
            <Input label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="••••••••" required />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-brand px-4 py-3 font-semibold text-cream shadow-zen hover:opacity-90 disabled:opacity-60"
            >
              {busy ? 'Un momento…' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </form>

          {/* Cambiar de modo */}
          <div className="mt-6 space-y-2 text-sm">
            {mode !== 'login' && (
              <button onClick={() => switchTo('login', setMode, setError)} className="text-ink-faint hover:text-ink">
                ¿Ya tienes cuenta? <span className="text-brand font-medium">Inicia sesión</span>
              </button>
            )}
            {mode === 'login' && (
              <>
                <button onClick={() => switchTo('join', setMode, setError)} className="block text-ink-faint hover:text-ink">
                  ¿Tienes un CEU? <span className="text-brand font-medium">Únete a tu estudio</span>
                </button>
                <button onClick={() => switchTo('create', setMode, setError)} className="block text-ink-faint hover:text-ink">
                  ¿Eres un estudio nuevo? <span className="text-brand font-medium">Crea tu cuenta</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes brandFloat { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-8px);} }
        .brand-float{ animation: brandFloat 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

function switchTo(m: Mode, setMode: (m: Mode) => void, setError: (s: string) => void) {
  setError('');
  setMode(m);
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-soft">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-cream-dark bg-white px-4 py-3 outline-none focus:ring-2 ring-brand"
      />
    </label>
  );
}

// Traduce los errores técnicos de Supabase a mensajes claros en español.
function translateError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/Invalid login credentials/i.test(msg)) return 'Correo o contraseña incorrectos.';
  if (/User already registered/i.test(msg)) return 'Ese correo ya está registrado. Inicia sesión.';
  if (/Database error saving new user/i.test(msg))
    return 'No se pudo completar el registro. Verifica que el CEU exista o el nombre del estudio.';
  if (/Password should be at least/i.test(msg)) return 'La contraseña debe tener al menos 6 caracteres.';
  if (/CEU/i.test(msg)) return msg;
  return msg || 'Ocurrió un error. Inténtalo de nuevo.';
}
