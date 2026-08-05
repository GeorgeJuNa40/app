import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Card } from '../../components/ui';
import ImageUpload from '../../components/ImageUpload';
import type { StudioInfoPage } from '../../lib/types';

// Editor de la página informativa PÚBLICA del estudio. Todos los campos son
// opcionales: el estudio llena solo lo que quiera compartir (o nada). Abajo se
// genera el link y el QR de esa página, que también incluye el registro.
export default function InfoPageEditor({
  value,
  ceuCode,
  onChange,
}: {
  value: StudioInfoPage;
  ceuCode: string;
  onChange: (patch: Partial<StudioInfoPage>) => void;
}) {
  const origin = window.location.origin;
  const publicLink = `${origin}/#/info/${encodeURIComponent(ceuCode)}`;
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(publicLink, { width: 320, margin: 1, color: { dark: '#4A5D55', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, [publicLink]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(publicLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* algunos navegadores bloquean el portapapeles */
    }
  };

  return (
    <Card className="p-6 lg:col-span-2 space-y-4">
      <div>
        <h2 className="font-semibold text-ink">Página informativa (opcional)</h2>
        <p className="mt-1 text-sm text-ink-faint">
          Una página pública con la info que <strong>tú</strong> decidas (clases, horarios, etc.), para
          que quien pase por tu estudio la vea aunque esté cerrado. Es un extra: si no la llenas, no pasa
          nada. Comparte el QR o el link de abajo (incluye el registro a la app).
        </p>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={value.enabled ?? false}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="h-4 w-4 accent-brand"
        />
        <span className="text-sm font-medium text-ink-soft">Publicar mi página informativa</span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Título / frase principal">
          <input
            className="input"
            value={value.headline ?? ''}
            onChange={(e) => onChange({ headline: e.target.value })}
            placeholder="(opcional)"
          />
        </Field>
        <Field label="Horario de atención">
          <input
            className="input"
            value={value.hours ?? ''}
            onChange={(e) => onChange({ hours: e.target.value })}
            placeholder="(opcional)"
          />
        </Field>
      </div>

      <Field label="Sobre el estudio">
        <textarea
          className="input"
          rows={3}
          value={value.about ?? ''}
          onChange={(e) => onChange({ about: e.target.value })}
          placeholder="(opcional)"
        />
      </Field>

      <Field label="Clases y horarios">
        <textarea
          className="input"
          rows={4}
          value={value.schedule ?? ''}
          onChange={(e) => onChange({ schedule: e.target.value })}
          placeholder="(opcional)"
        />
      </Field>

      <Field label="Contacto y ubicación">
        <textarea
          className="input"
          rows={2}
          value={value.contact ?? ''}
          onChange={(e) => onChange({ contact: e.target.value })}
          placeholder="(opcional)"
        />
      </Field>

      <div>
        <span className="mb-1 block text-sm font-medium text-ink-soft">Imagen o flyer (opcional)</span>
        <div className="flex items-center gap-3">
          {value.flyerUrl ? (
            <img src={value.flyerUrl} alt="Flyer" className="h-16 rounded-lg border border-cream-dark" />
          ) : (
            <div className="grid h-16 w-24 place-items-center rounded-lg bg-cream-dark/40 text-xs text-ink-faint">
              Sin imagen
            </div>
          )}
          <ImageUpload label="Subir imagen" onSelect={(url) => onChange({ flyerUrl: url })} />
          {value.flyerUrl && (
            <button type="button" onClick={() => onChange({ flyerUrl: undefined })} className="text-sm text-red-600">
              Quitar
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-ink-faint">
          Si tienes un PDF (ej. menú de clases), sube una foto o captura de él como imagen.
        </p>
      </div>

      {/* Compartir la página pública */}
      <div className="border-t border-cream-dark pt-4">
        <span className="mb-1 block text-sm font-medium text-ink-soft">Tu link público</span>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={publicLink}
            onFocus={(e) => e.target.select()}
            className="flex-1 rounded-xl border border-cream-dark bg-white px-3 py-2.5 text-sm text-ink-soft"
          />
          <button
            type="button"
            onClick={copy}
            className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-cream hover:opacity-90"
          >
            {copied ? '¡Copiado!' : 'Copiar'}
          </button>
        </div>
        {qr && (
          <div className="mt-3 flex flex-col items-center gap-2">
            <img src={qr} alt="Código QR de la página informativa" className="h-40 w-40 rounded-xl border border-cream-dark" />
            <a href={qr} download={`info-${ceuCode}.png`} className="text-sm font-medium text-brand hover:underline">
              Descargar QR
            </a>
            <p className="text-xs text-ink-faint text-center">
              Imprímelo y colócalo en tu estudio. Quien lo escanee verá tu info y podrá registrarse.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
