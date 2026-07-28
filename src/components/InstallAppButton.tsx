import { useEffect, useState } from 'react';
import { canInstall, isIOS, isStandalone, onInstallChange, promptInstall } from '../lib/pwa';

// Botón permanente "Instalar app". Reemplaza al mini-aviso del navegador que
// solo aparecía un instante. En iOS (que no soporta el aviso automático) muestra
// instrucciones para "Agregar a inicio". Se oculta si la app ya está instalada.
export default function InstallAppButton({ className = '' }: { className?: string }) {
  const [, force] = useState(0);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => onInstallChange(() => force((n) => n + 1)), []);

  // Ya está instalada / abierta como app: no mostramos nada.
  if (isStandalone()) return null;

  const ios = isIOS();
  // En iOS el navegador no expone el evento de instalación; mostramos ayuda manual.
  // En el resto, solo mostramos el botón cuando el navegador dice que se puede instalar.
  if (!ios && !canInstall()) return null;

  const handleClick = async () => {
    if (ios) {
      setShowIosHelp(true);
      return;
    }
    await promptInstall();
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`w-full rounded-xl bg-brand px-3 py-2 text-sm font-medium text-cream hover:opacity-90 ${className}`}
      >
        ⭳ Instalar app
      </button>

      {showIosHelp && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowIosHelp(false)} />
          <div className="relative m-4 w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-bold text-ink">Instalar Move yA</h3>
            <p className="mt-2 text-sm text-ink-soft">
              En iPhone/iPad, para dejar la app en tu pantalla de inicio:
            </p>
            <ol className="mt-3 space-y-2 text-sm text-ink-soft">
              <li>
                1. Toca el botón <span className="font-semibold">Compartir</span>{' '}
                <span className="inline-block">⬆️</span> en la barra de Safari.
              </li>
              <li>
                2. Elige <span className="font-semibold">Agregar a inicio</span>{' '}
                <span className="inline-block">➕</span>.
              </li>
              <li>
                3. Confirma con <span className="font-semibold">Agregar</span>.
              </li>
            </ol>
            <button
              onClick={() => setShowIosHelp(false)}
              className="mt-4 w-full rounded-xl bg-brand px-3 py-2 text-sm font-medium text-cream"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
