import type { Branding } from '../lib/types';

// Muestra el logo del estudio (imagen subida). Con showName, muestra también
// el nombre del estudio al lado. Si no hay logo, muestra solo el nombre.
export default function StudioLogo({
  branding,
  imgClass = 'h-9 max-w-[150px]',
  textClass = 'text-lg font-bold text-brand',
  showName = false,
}: {
  branding: Branding;
  imgClass?: string;
  textClass?: string;
  showName?: boolean;
}) {
  if (branding.logoUrl) {
    // Forma del logo: círculo (recorta a redondo) o cuadrado con esquinas
    // redondeadas (por defecto). Los logos circulares quedan circulares.
    const shapeCls =
      branding.logoShape === 'circle'
        ? 'rounded-full object-cover aspect-square'
        : 'rounded-lg object-contain';
    return (
      <span className="inline-flex items-center gap-2 min-w-0">
        <img
          src={branding.logoUrl}
          alt={branding.logoText}
          className={`shrink-0 ${shapeCls} ${imgClass}`}
        />
        {showName && <span className={`truncate ${textClass}`}>{branding.logoText}</span>}
      </span>
    );
  }
  return <span className={textClass}>{branding.logoText}</span>;
}
