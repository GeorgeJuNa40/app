// Catálogo de países para el registro: código de país (lada), moneda local y
// bandera. Al registrarse se captura el teléfono con lada y de ahí se deriva la
// moneda del estudio (MXN para México, USD para EE. UU., etc.).
export interface Country {
  iso: string;
  name: string;
  dial: string; // código de país / lada (ej. +52)
  currency: string; // moneda local (ej. MXN)
  flag: string;
}

export const COUNTRIES: Country[] = [
  { iso: 'MX', name: 'México', dial: '+52', currency: 'MXN', flag: '🇲🇽' },
  { iso: 'US', name: 'Estados Unidos', dial: '+1', currency: 'USD', flag: '🇺🇸' },
  { iso: 'AR', name: 'Argentina', dial: '+54', currency: 'ARS', flag: '🇦🇷' },
  { iso: 'CO', name: 'Colombia', dial: '+57', currency: 'COP', flag: '🇨🇴' },
  { iso: 'CL', name: 'Chile', dial: '+56', currency: 'CLP', flag: '🇨🇱' },
  { iso: 'PE', name: 'Perú', dial: '+51', currency: 'PEN', flag: '🇵🇪' },
  { iso: 'ES', name: 'España', dial: '+34', currency: 'EUR', flag: '🇪🇸' },
  { iso: 'GT', name: 'Guatemala', dial: '+502', currency: 'GTQ', flag: '🇬🇹' },
  { iso: 'EC', name: 'Ecuador', dial: '+593', currency: 'USD', flag: '🇪🇨' },
  { iso: 'CR', name: 'Costa Rica', dial: '+506', currency: 'CRC', flag: '🇨🇷' },
  { iso: 'PA', name: 'Panamá', dial: '+507', currency: 'USD', flag: '🇵🇦' },
  { iso: 'UY', name: 'Uruguay', dial: '+598', currency: 'UYU', flag: '🇺🇾' },
  { iso: 'PY', name: 'Paraguay', dial: '+595', currency: 'PYG', flag: '🇵🇾' },
  { iso: 'BO', name: 'Bolivia', dial: '+591', currency: 'BOB', flag: '🇧🇴' },
  { iso: 'DO', name: 'Rep. Dominicana', dial: '+1', currency: 'DOP', flag: '🇩🇴' },
  { iso: 'VE', name: 'Venezuela', dial: '+58', currency: 'VES', flag: '🇻🇪' },
];

export const DEFAULT_COUNTRY_ISO = 'MX';

export const getCountry = (iso: string): Country =>
  COUNTRIES.find((c) => c.iso === iso) ?? COUNTRIES[0];

// Lista de monedas únicas (para el selector de moneda en Configuración).
export const CURRENCIES: string[] = Array.from(
  new Set(COUNTRIES.map((c) => c.currency)),
).sort();
