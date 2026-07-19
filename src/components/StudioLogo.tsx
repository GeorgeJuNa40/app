import type { Branding } from '../lib/types';

// Muestra el logo del estudio (imagen subida) o, si no hay, su nombre en texto.
export default function StudioLogo({
  branding,
  imgClass = 'h-9 max-w-[150px]',
  textClass = 'text-lg font-bold text-brand',
}: {
  branding: Branding;
  imgClass?: string;
  textClass?: string;
}) {
  if (branding.logoUrl) {
    return <img src={branding.logoUrl} alt={branding.logoText} className={`object-contain ${imgClass}`} />;
  }
  return <span className={textClass}>{branding.logoText}</span>;
}
