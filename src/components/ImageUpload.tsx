import { useRef, useState } from 'react';
import { fileToDataUrl } from '../lib/image';

// Botón para subir una imagen desde el dispositivo (jpg, png, etc.).
// Devuelve un data URL comprimido vía onSelect.
export default function ImageUpload({
  onSelect,
  label = 'Subir foto',
  className = '',
  variant = 'button',
}: {
  onSelect: (dataUrl: string) => void;
  label?: string;
  className?: string;
  variant?: 'button' | 'dropzone';
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const url = await fileToDataUrl(file);
      onSelect(url);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      if (ref.current) ref.current.value = '';
    }
  };

  const base =
    variant === 'dropzone'
      ? 'flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-cream-dark text-ink-faint hover:border-brand hover:text-brand transition py-6 px-4 text-sm'
      : 'inline-flex items-center justify-center gap-2 rounded-xl bg-cream-dark text-ink hover:bg-cream px-4 py-2.5 text-sm font-semibold';

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={loading}
        className={`${base} disabled:opacity-50 ${className}`}
      >
        {variant === 'dropzone' && <span className="text-xl">⬆</span>}
        {loading ? 'Procesando…' : label}
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handle} />
    </>
  );
}
