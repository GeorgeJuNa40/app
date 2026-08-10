import { useState } from 'react';
import { useStore } from '../../lib/store';

// Pantalla para crear una nueva contraseña. Se muestra cuando el usuario llega
// desde el correo de "restablecer contraseña" (Supabase abre una sesión de
// recuperación → store.recoveryMode = true). Al guardar, updatePassword apaga
// recoveryMode y App.tsx lo lleva a su panel ya con sesión iniciada.
export default function ResetPassword() {
  const { updatePassword } = useStore();
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (pass.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    if (pass !== confirm) return setError('Las contraseñas no coinciden.');
    setBusy(true);
    try {
      await updatePassword(pass);
      setDone(true);
      // recoveryMode pasa a false dentro de updatePassword; App.tsx toma el control.
    } catch {
      setError('No se pudo actualizar. Vuelve a abrir el enlace del correo (pudo expirar).');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-cream p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-zen">
        <div className="brand-float mb-4 text-3xl font-black tracking-tight text-brand">Move yA</div>
        <h1 className="text-2xl font-bold text-ink">Nueva contraseña</h1>
        <p className="mt-1 mb-6 text-ink-faint">Escribe tu nueva contraseña para entrar.</p>

        {done ? (
          <p className="rounded-xl bg-mint-soft/40 px-4 py-3 text-sm text-ink-soft">
            ¡Listo! Tu contraseña se actualizó. Un momento…
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-soft">Nueva contraseña</span>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-cream-dark bg-white px-4 py-3 pr-12 outline-none focus:ring-2 ring-brand"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute inset-y-0 right-0 grid w-12 place-items-center text-lg text-ink-faint"
                  aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {show ? '🙈' : '👁️'}
                </button>
              </div>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-soft">Repite la contraseña</span>
              <input
                type={show ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-cream-dark bg-white px-4 py-3 outline-none focus:ring-2 ring-brand"
              />
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-brand px-4 py-3 font-semibold text-cream shadow-zen hover:opacity-90 disabled:opacity-60"
            >
              {busy ? 'Guardando…' : 'Guardar y entrar'}
            </button>
          </form>
        )}
      </div>
      <style>{`
        @keyframes brandFloat { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-8px);} }
        .brand-float{ animation: brandFloat 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
