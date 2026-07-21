// Muestra en pantalla un aviso cuando algo falla al guardar en la nube,
// para no depender de la consola del navegador. Evita spam (máx. uno cada 3s).
let lastShown = 0;

export function notifyError(context: string, message: string) {
  console.error(`${context}:`, message);
  if (typeof document === 'undefined') return;
  const now = Date.now();
  if (now - lastShown < 3000) return;
  lastShown = now;

  const el = document.createElement('div');
  el.textContent = `⚠️ No se pudo guardar (${context}): ${message}`;
  el.style.cssText =
    'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);' +
    'background:#b91c1c;color:#fff;padding:10px 16px;border-radius:12px;' +
    'font:14px system-ui,sans-serif;z-index:9999;max-width:90%;text-align:center;' +
    'box-shadow:0 6px 20px rgba(0,0,0,.25)';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 6000);
}
