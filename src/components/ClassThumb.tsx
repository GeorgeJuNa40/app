import type { ClassTemplate } from '../lib/types';

// Muestra la foto del tipo de clase; si no hay, un gradiente con la inicial.
export default function ClassThumb({
  tpl,
  className = '',
  rounded = 'rounded-xl',
}: {
  tpl: ClassTemplate;
  className?: string;
  rounded?: string;
}) {
  if (tpl.photoUrl) {
    return (
      <img
        src={tpl.photoUrl}
        alt={tpl.name}
        className={`object-cover ${rounded} ${className}`}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }
  return (
    <div
      className={`grid place-items-center text-white font-bold ${rounded} ${className}`}
      style={{
        background: `linear-gradient(135deg, ${tpl.colorHex}, ${tpl.colorHex}99)`,
      }}
      aria-hidden
    >
      {tpl.name.slice(0, 1)}
    </div>
  );
}
