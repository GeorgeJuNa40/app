import type { PlanId } from './types';

// Catálogo de planes de suscripción del panel del Estudio.
// Precios mensuales en USD (terminados en .99). Durante la prueba de
// lanzamiento ($1 · 14 días) se habilita el plan Pro completo.
export interface Plan {
  id: PlanId;
  name: string;
  priceUsd: number;
  tagline: string;
  highlight?: boolean; // plan destacado ("Más popular")
  features: string[];
}

export const PROMO_PRICE = 1;
export const PROMO_TRIAL_DAYS = 14;
export const PROMO_PLAN: PlanId = 'pro'; // plan que se habilita durante la prueba

export const PLANS: Plan[] = [
  {
    id: 'inicio',
    name: 'Inicio',
    priceUsd: 19.99,
    tagline: 'Para estudios que están comenzando',
    features: [
      'Hasta 50 alumnos activos',
      'Hasta 3 coaches',
      'Calendario y reservas en línea',
      'Gestión de paquetes y pagos (CRM)',
      'Recordatorios de clase',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceUsd: 39.99,
    tagline: 'El favorito de los estudios en marcha',
    highlight: true,
    features: [
      'Alumnos ilimitados',
      'Hasta 5 coaches',
      'Todo lo del plan Inicio',
      'White label (tu propia marca y colores)',
      'Gamificación y recompensas',
      'Servicios opcionales',
      'Reportes de ingresos y asistencia',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    priceUsd: 79.99,
    tagline: 'Para estudios en pleno crecimiento',
    features: [
      'Todo lo del plan Pro',
      'Coaches ilimitados',
      'Agente de WhatsApp con IA',
      'Reportes avanzados',
      'Soporte prioritario',
      'Multi-sucursal (próximamente)',
    ],
  },
];

export const getPlan = (id: PlanId): Plan =>
  PLANS.find((p) => p.id === id) ?? PLANS[1];
