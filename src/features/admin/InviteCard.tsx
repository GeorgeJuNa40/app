import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Card } from '../../components/ui';

// Tarjeta para invitar alumnos: código CEU, link personalizado y código QR.
// El link lleva el CEU dentro, así el alumno entra sin escribir nada.
export default function InviteCard({ ceuCode }: { ceuCode: string }) {
  // El link usa el mismo dominio desde el que el admin abre la app.
  const link = `${window.location.origin}/#/?ceu=${encodeURIComponent(ceuCode)}`;
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState<'ceu' | 'link' | ''>('');

  useEffect(() => {
    QRCode.toDataURL(link, {
      width: 320,
      margin: 1,
      color: { dark: '#2D5A4C', light: '#ffffff' },
    })
      .then(setQr)
      .catch(() => setQr(''));
  }, [link]);

  const copy = async (text: string, which: 'ceu' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      /* algunos navegadores bloquean el portapapeles; el usuario puede copiar manual */
    }
  };

  return (
    <Card className="p-6 mb-6">
      <h2 className="font-semibold text-ink">Invita a tus alumnos</h2>
      <p className="mt-1 mb-4 text-sm text-ink-faint">
        Comparte tu código, tu link o el código QR. Con el <strong>link</strong> o el <strong>QR</strong>,
        tus alumnos entran a tu estudio sin escribir nada.
      </p>

      <div className="grid gap-5 md:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          {/* CEU */}
          <div>
            <span className="mb-1 block text-sm font-medium text-ink-soft">Código de Estudio (CEU)</span>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-xl bg-cream-dark/50 px-4 py-3 text-lg font-bold tracking-widest text-brand">
                {ceuCode}
              </code>
              <button
                type="button"
                onClick={() => copy(ceuCode, 'ceu')}
                className="rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-cream hover:opacity-90"
              >
                {copied === 'ceu' ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Link */}
          <div>
            <span className="mb-1 block text-sm font-medium text-ink-soft">Link de invitación</span>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={link}
                onFocus={(e) => e.target.select()}
                className="flex-1 rounded-xl border border-cream-dark bg-white px-3 py-2.5 text-sm text-ink-soft"
              />
              <button
                type="button"
                onClick={() => copy(link, 'link')}
                className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-cream hover:opacity-90"
              >
                {copied === 'link' ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>
            <p className="mt-1 text-xs text-ink-faint">
              Al abrir este link, el alumno ya tendrá tu código puesto. Solo crea su cuenta.
            </p>
          </div>
        </div>

        {/* QR */}
        {qr && (
          <div className="flex flex-col items-center gap-2">
            <img
              src={qr}
              alt="Código QR de invitación"
              className="h-40 w-40 rounded-xl border border-cream-dark"
            />
            <a
              href={qr}
              download={`invitacion-${ceuCode}.png`}
              className="text-sm font-medium text-brand hover:underline"
            >
              Descargar QR
            </a>
          </div>
        )}
      </div>
    </Card>
  );
}
