// Tipos del dominio Move yA (espejo del esquema Prisma, versión front del MVP).

export type Role = 'STUDIO_ADMIN' | 'COACH' | 'STUDENT';

export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING';

export type BookingStatus = 'RESERVED' | 'ATTENDED' | 'CANCELED' | 'NO_SHOW';

export type OptionalServiceType = 'NUTRITION' | 'KINESIOLOGY' | 'SPORTS_MEDICINE';

export interface Branding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoText: string; // en el MVP el "logo" es texto; en prod sería logoUrl
  heroPhotoUrl?: string;
}

export interface ServiceConfig {
  nutritionEnabled: boolean;
  kinesiologyEnabled: boolean;
  sportsMedicineEnabled: boolean;
}

export interface Subscription {
  status: SubscriptionStatus;
  priceUsd: number;
  currentPeriodEnd: string; // ISO date
}

export interface Studio {
  id: string;
  name: string;
  ceuCode: string;
  branding: Branding;
  serviceConfig: ServiceConfig;
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
  avatarInitials: string;
  coachProfile?: CoachProfile;
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
  stars: StarEntry[];
  rewards: Reward[];
  goals: Goal[];
}
