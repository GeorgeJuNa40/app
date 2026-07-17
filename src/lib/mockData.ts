import type { Database } from './types';

// Helpers de fecha para generar un calendario relativo a "hoy".
function atHour(dayOffset: number, hour: number, min = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}
function plusMinutes(iso: string, min: number): string {
  return new Date(new Date(iso).getTime() + min * 60000).toISOString();
}
function inDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// SEED — un estudio de ejemplo "Zen Studio" con datos completos.
// CEU codes de demo (ver LoginScreen):
//   ZEN-ADMIN  -> Estudio (Admin)
//   ZEN-COACH  -> Coach
//   ZEN-2024   -> Usuario / Alumno
// ---------------------------------------------------------------------------

export function seedDatabase(): Database {
  const studioId = 'studio_zen';

  const classTemplates = [
    { id: 'ct_reformer', studioId, name: 'Reformer Flow', durationMin: 50, colorHex: '#2D5A4C' },
    { id: 'ct_mat', studioId, name: 'Mat Pilates', durationMin: 45, colorHex: '#3C7364' },
    { id: 'ct_barre', studioId, name: 'Barre Fusion', durationMin: 55, colorHex: '#7A9B8E' },
    { id: 'ct_prenatal', studioId, name: 'Prenatal', durationMin: 40, colorHex: '#B08968' },
  ];

  // Genera sesiones para los próximos 7 días (mañana y tarde).
  const classSessions = [];
  let sIdx = 0;
  for (let day = 0; day < 7; day++) {
    const slots = [
      { h: 7, tpl: 'ct_reformer', coach: 'user_coach', cap: 8 },
      { h: 9, tpl: 'ct_mat', coach: 'user_coach', cap: 12 },
      { h: 18, tpl: 'ct_barre', coach: 'user_coach2', cap: 10 },
      { h: 19, tpl: 'ct_reformer', coach: 'user_coach2', cap: 8 },
    ];
    for (const slot of slots) {
      const startsAt = atHour(day, slot.h);
      const tpl = classTemplates.find((t) => t.id === slot.tpl)!;
      classSessions.push({
        id: `cs_${sIdx++}`,
        studioId,
        templateId: slot.tpl,
        coachId: slot.coach,
        startsAt,
        endsAt: plusMinutes(startsAt, tpl.durationMin),
        capacity: slot.cap,
      });
    }
  }

  const db: Database = {
    studios: [
      {
        id: studioId,
        name: 'Zen Studio Pilates',
        ceuCode: 'ZEN-2024',
        branding: {
          primaryColor: '#2D5A4C',
          secondaryColor: '#F4F1EA',
          accentColor: '#333333',
          fontFamily: 'Inter',
          logoText: 'Zen Studio',
        },
        serviceConfig: {
          nutritionEnabled: true,
          kinesiologyEnabled: true,
          sportsMedicineEnabled: false,
        },
        subscription: {
          status: 'ACTIVE',
          priceUsd: 34,
          currentPeriodEnd: inDays(18),
        },
      },
    ],
    users: [
      {
        id: 'user_admin',
        studioId,
        role: 'STUDIO_ADMIN',
        fullName: 'Ana Torres',
        email: 'ana@zenstudio.mx',
        avatarInitials: 'AT',
      },
      {
        id: 'user_coach',
        studioId,
        role: 'COACH',
        fullName: 'Marco Ríos',
        email: 'marco@zenstudio.mx',
        avatarInitials: 'MR',
        coachProfile: {
          bio: 'Instructor certificado en Reformer y Mat con enfoque en rehabilitación postural.',
          specialties: ['Reformer', 'Mat', 'Rehabilitación'],
          yearsExp: 8,
        },
      },
      {
        id: 'user_coach2',
        studioId,
        role: 'COACH',
        fullName: 'Lucía Fernández',
        email: 'lucia@zenstudio.mx',
        avatarInitials: 'LF',
        coachProfile: {
          bio: 'Especialista en Barre Fusion y entrenamiento prenatal.',
          specialties: ['Barre', 'Prenatal'],
          yearsExp: 5,
        },
      },
      {
        id: 'user_student',
        studioId,
        role: 'STUDENT',
        fullName: 'Sofía Méndez',
        email: 'sofia@example.com',
        avatarInitials: 'SM',
      },
      {
        id: 'user_student2',
        studioId,
        role: 'STUDENT',
        fullName: 'Diego Luna',
        email: 'diego@example.com',
        avatarInitials: 'DL',
      },
    ],
    packages: [
      {
        id: 'pkg_starter',
        studioId,
        name: 'Starter · 4 clases',
        description: 'Ideal para comenzar. 4 clases a elegir dentro del mes.',
        priceUsd: 60,
        classCredits: 4,
        validityDays: 30,
        active: true,
        eligibleClassIds: ['ct_reformer', 'ct_mat'],
      },
      {
        id: 'pkg_flow',
        studioId,
        name: 'Flow · 8 clases',
        description: 'El favorito. 8 clases con acceso a Reformer, Mat y Barre.',
        priceUsd: 110,
        classCredits: 8,
        validityDays: 45,
        active: true,
        eligibleClassIds: ['ct_reformer', 'ct_mat', 'ct_barre'],
      },
      {
        id: 'pkg_unlimited',
        studioId,
        name: 'Zen Ilimitado',
        description: 'Clases ilimitadas por 30 días. Todas las disciplinas.',
        priceUsd: 180,
        classCredits: 40,
        validityDays: 30,
        active: true,
        eligibleClassIds: ['ct_reformer', 'ct_mat', 'ct_barre', 'ct_prenatal'],
      },
    ],
    userPackages: [
      {
        id: 'up_1',
        userId: 'user_student',
        packageId: 'pkg_flow',
        creditsTotal: 8,
        creditsUsed: 3,
        purchasedAt: daysAgo(10),
        expiresAt: inDays(35),
        active: true,
      },
    ],
    classTemplates,
    classSessions,
    bookings: [
      // Reservas del alumno demo en sesiones próximas.
      {
        id: 'bk_1',
        userId: 'user_student',
        sessionId: 'cs_0',
        userPackageId: 'up_1',
        status: 'RESERVED',
        createdAt: daysAgo(1),
      },
      {
        id: 'bk_2',
        userId: 'user_student2',
        sessionId: 'cs_0',
        userPackageId: null,
        status: 'RESERVED',
        createdAt: daysAgo(1),
      },
      {
        id: 'bk_3',
        userId: 'user_student2',
        sessionId: 'cs_1',
        userPackageId: null,
        status: 'RESERVED',
        createdAt: daysAgo(1),
      },
    ],
    stars: [
      { id: 'st_1', userId: 'user_student', delta: 1, reason: 'attendance', createdAt: daysAgo(9) },
      { id: 'st_2', userId: 'user_student', delta: 1, reason: 'attendance', createdAt: daysAgo(6) },
      { id: 'st_3', userId: 'user_student', delta: 1, reason: 'attendance', createdAt: daysAgo(3) },
      { id: 'st_4', userId: 'user_student', delta: 2, reason: 'bonus', createdAt: daysAgo(2) },
    ],
    rewards: [
      {
        id: 'rw_1',
        studioId,
        name: 'Clase de regalo',
        description: 'Una clase gratis para ti o un invitado.',
        starCost: 10,
        active: true,
      },
      {
        id: 'rw_2',
        studioId,
        name: 'Botella Move yA',
        description: 'Botella térmica de edición limitada.',
        starCost: 15,
        active: true,
      },
      {
        id: 'rw_3',
        studioId,
        name: 'Sesión de Nutrición',
        description: 'Consulta 1:1 con nuestro nutriólogo.',
        starCost: 25,
        active: true,
      },
    ],
    goals: [
      {
        id: 'goal_1',
        userId: 'user_student',
        title: 'Asistir 12 clases este mes',
        targetValue: 12,
        currentValue: 3,
        periodEnd: inDays(20),
        achieved: false,
      },
      {
        id: 'goal_2',
        userId: 'user_student',
        title: 'Racha de 3 semanas',
        targetValue: 3,
        currentValue: 2,
        periodEnd: inDays(7),
        achieved: false,
      },
    ],
  };

  return db;
}
