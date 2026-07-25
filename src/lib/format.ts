// Helpers de formato de fecha/hora en español.

const DAY_FMT = new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
const TIME_FMT = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' });
const FULL_DAY_FMT = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

export const fmtDay = (iso: string) => DAY_FMT.format(new Date(iso));
export const fmtTime = (iso: string) => TIME_FMT.format(new Date(iso));
export const fmtFullDay = (iso: string) => FULL_DAY_FMT.format(new Date(iso));

export const dayKey = (iso: string) => new Date(iso).toISOString().slice(0, 10);

// Moneda activa del estudio (MXN, USD, EUR, …). La fija StoreProvider según el
// estudio en sesión; por defecto USD. Así los precios se muestran en la moneda
// local sin tener que tocar cada pantalla.
let activeCurrency = 'USD';
export function setActiveCurrency(code: string | undefined) {
  activeCurrency = code || 'USD';
}
export const money = (n: number, code: string = activeCurrency) =>
  `$${n.toLocaleString('es-MX')} ${code}`;
// Precio en la moneda local del estudio (antes siempre USD).
export const usd = (n: number) => money(n);

export function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
