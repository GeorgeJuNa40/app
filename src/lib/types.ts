// Tipos del dominio Move yA (espejo del esquema Prisma, versión front del MVP).

export type Role = 'STUDIO_ADMIN' | 'COACH' | 'STUDENT';

export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING';

export type BookingStatus = 'RESERVED' | 'ATTENDED' | 'CANCELED' | 'NO_SHOW';

export type CoachStatus = 'APPROVED' | 'PENDING' | 'DENIED';

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'paypal';

export type MembershipState = 'active' | 'expiring' | 'expired' | 'none';

export interface Branding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoText: string;
  logoUrl?: string; // logo del estudio (imagen subida), visible para todos
  heroPhotoUrl?: string;
}

// Servicio opcional editable por el estudio (Nutrición, Kinesiología, etc.).
export interface OptionalService {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  custom: boolean; // los custom se pueden eliminar
}

// Plantilla de mensaje del bot de WhatsApp, editable por el estudio.
export interface WhatsappTemplate {
  id: string;
  label: string;
  text: string;
}

export interface WhatsappConfig {
  number: string; // número del estudio (formato internacional, sin +)
  botEnabled: boolean;
  templates: WhatsappTemplate[];
  knowledge: string[]; // retro/base de conocimiento para que el bot responda
}

export interface Subscription {
  status: SubscriptionStatus;
  priceUsd: number; // precio mensual estándar (34.99)
  promoPriceUsd: number; // precio de la promo de lanzamiento (1)
  trialDays: number; // días de prueba de la promo (14)
  isPromo: boolean; // registrado dentro de la ventana de lanzamiento (3 meses)
  trialEndsAt: string; // fin de la prueba
  currentPeriodEnd: string; // acceso hasta esta fecha
}

export interface Studio {
  id: string;
  name: string;
  ceuCode: string;
  phone: string;
  email: string;
  address: string;
  photos: string[]; // galería (URLs)
  branding: Branding;
  services: OptionalService[];
  whatsapp: WhatsappConfig;
  subscription: Subscription;
}

export interface CoachProfile {
  bio: string;
  specialties: string[];
  yearsExp: number;
}

export interface User {
  id: string;
  studioId: string;
  role: Role;
  fullName: string;
  email: string;
  phone: string;
  avatarInitials: string;
  avatarUrl?: string; // foto de perfil (subida como archivo)
  createdAt: string;
  coachProfile?: CoachProfile;
  coachStatus?: CoachStatus; // solo coaches
}

export interface Package {
  id: string;
  studioId: string;
  name: string;
  description: string;
  priceUsd: number;
  classCredits: number;
  validityDays: number;
  active: boolean;
  eligibleClassIds: string[];
}

export interface UserPackage {
  id: string;
  userId: string;
  packageId: string;
  creditsTotal: number;
  creditsUsed: number;
  purchasedAt: string;
  expiresAt: string;
  active: boolean;
}

export interface ClassTemplate {
  id: string;
  studioId: string;
  name: string;
  durationMin: number;
  colorHex: string;
  photoUrl?: string; // foto que define el tipo de clase
}

export interface ClassSession {
  id: string;
  studioId: string;
  templateId: string;
  coachId: string | null;
  startsAt: string; // ISO
  endsAt: string;
  capacity: number;
}

export interface Booking {
  id: string;
  userId: string;
  sessionId: string;
  userPackageId: string | null;
  status: BookingStatus;
  createdAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  amountUsd: number;
  method: PaymentMethod;
  packageId?: string;
  concept: string;
  paidAt: string;
  registeredBy: 'studio' | 'online'; // manual (estudio) u online (pasarela)
}

export interface StarEntry {
  id: string;
  userId: string;
  delta: number;
  reason: 'attendance' | 'redemption' | 'bonus';
  createdAt: string;
}

export interface Reward {
  id: string;
  studioId: string;
  name: string;
  description: string;
  starCost: number;
  active: boolean;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  targetValue: number;
  currentValue: number;
  periodEnd: string;
  achieved: boolean;
}

export interface Database {
  studios: Studio[];
  users: User[];
  packages: Package[];
  userPackages: UserPackage[];
  classTemplates: ClassTemplate[];
  classSessions: ClassSession[];
  bookings: Booking[];
  payments: Payment[];
  stars: StarEntry[];
  rewards: Reward[];
  goals: Goal[];
}
