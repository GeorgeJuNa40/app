import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  Booking,
  Branding,
  ClassSession,
  ClassTemplate,
  Database,
  MembershipState,
  OptionalService,
  Package,
  Payment,
  PaymentMethod,
  Reward,
  Studio,
  User,
  WhatsappConfig,
  WhatsappTemplate,
} from './types';
import { seedDatabase } from './mockData';

const STORAGE_KEY = 'moveya_db_v2';
const SESSION_KEY = 'moveya_session_v1';

function loadDb(): Database {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Database;
  } catch {
    /* ignore */
  }
  return seedDatabase();
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export interface MembershipInfo {
  state: MembershipState;
  planName: string | null;
  creditsLeft: number;
  expiresAt: string | null;
  daysLeft: number;
}

interface StoreValue {
  db: Database;
  currentUser: User | null;
  currentStudio: Studio | null;
  // Auth
  loginWithCeu: (ceu: string, role: User['role']) => User | null;
  logout: () => void;
  resetDemoData: () => void;
  // Selectors
  seatsLeft: (sessionId: string) => number;
  studioUsers: (role: User['role']) => User[];
  starBalance: (userId: string) => number;
  membership: (userId: string) => MembershipInfo;
  // Alumno
  bookSession: (sessionId: string) => void;
  cancelBooking: (bookingId: string) => void;
  buyPackageOnline: (packageId: string, method: PaymentMethod) => void;
  redeemReward: (rewardId: string) => void;
  // Estudio — pagos y planes
  registerManualPlan: (userId: string, packageId: string, method: PaymentMethod) => void;
  // Estudio — paquetes
  upsertPackage: (pkg: Package) => void;
  togglePackageActive: (packageId: string) => void;
  // Estudio — clases (tipos) y sesiones (calendario)
  upsertClassTemplate: (tpl: ClassTemplate) => void;
  deleteClassTemplate: (id: string) => void;
  upsertSession: (s: ClassSession) => void;
  deleteSession: (id: string) => void;
  // Estudio — coaches
  setCoachStatus: (userId: string, status: User['coachStatus']) => void;
  upsertCoach: (coach: User) => void;
  // Perfil — foto de cualquier usuario (admin, coach, alumno)
  updateUserAvatar: (userId: string, avatarUrl: string) => void;
  // Estudio — servicios
  addService: (name: string, description: string) => void;
  updateService: (id: string, patch: Partial<OptionalService>) => void;
  removeService: (id: string) => void;
  // Estudio — recompensas
  upsertReward: (reward: Reward) => void;
  deleteReward: (id: string) => void;
  // Estudio — negocio / branding / whatsapp
  updateStudio: (patch: Partial<Studio>) => void;
  updateBranding: (patch: Partial<Branding>) => void;
  updateWhatsapp: (patch: Partial<WhatsappConfig>) => void;
  upsertWhatsappTemplate: (t: WhatsappTemplate) => void;
  deleteWhatsappTemplate: (id: string) => void;
  addKnowledge: (text: string) => void;
  removeKnowledge: (index: number) => void;
  // Suscripción SaaS
  markSubscriptionPaid: () => void;
  setSubscriptionPastDue: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

let idCounter = 1000;
const nextId = (prefix: string) => `${prefix}_${idCounter++}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(loadDb);
  const [currentUserId, setCurrentUserId] = useState<string | null>(() =>
    localStorage.getItem(SESSION_KEY),
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }, [db]);
  useEffect(() => {
    if (currentUserId) localStorage.setItem(SESSION_KEY, currentUserId);
    else localStorage.removeItem(SESSION_KEY);
  }, [currentUserId]);

  const currentUser = useMemo(
    () => db.users.find((u) => u.id === currentUserId) ?? null,
    [db.users, currentUserId],
  );
  const currentStudio = useMemo(
    () => db.studios.find((s) => s.id === currentUser?.studioId) ?? null,
    [db.studios, currentUser],
  );

  // White-label: aplica branding a las CSS vars en vivo.
  useEffect(() => {
    const b = currentStudio?.branding;
    const root = document.documentElement;
    if (b) {
      root.style.setProperty('--brand-primary', b.primaryColor);
      root.style.setProperty('--brand-secondary', b.secondaryColor);
      root.style.setProperty('--brand-accent', b.accentColor);
      root.style.setProperty('--brand-font', `'${b.fontFamily}', system-ui, sans-serif`);
    }
  }, [currentStudio]);

  // Helper: modifica el estudio actual.
  const patchStudio = (fn: (s: Studio) => Studio) =>
    setDb((prev) => ({
      ...prev,
      studios: prev.studios.map((s) => (s.id === currentUser?.studioId ? fn(s) : s)),
    }));

  const value: StoreValue = {
    db,
    currentUser,
    currentStudio,

    loginWithCeu(ceu, role) {
      const studio = db.studios.find(
        (s) => s.ceuCode.toUpperCase() === ceu.trim().toUpperCase(),
      );
      if (!studio) return null;
      const user = db.users.find((u) => u.studioId === studio.id && u.role === role);
      if (!user) return null;
      setCurrentUserId(user.id);
      return user;
    },
    logout() {
      setCurrentUserId(null);
    },
    resetDemoData() {
      setDb(seedDatabase());
      setCurrentUserId(null);
    },

    seatsLeft(sessionId) {
      const session = db.classSessions.find((s) => s.id === sessionId);
      if (!session) return 0;
      const taken = db.bookings.filter(
        (b) => b.sessionId === sessionId && b.status !== 'CANCELED',
      ).length;
      return Math.max(0, session.capacity - taken);
    },
    studioUsers(role) {
      return db.users.filter((u) => u.studioId === currentUser?.studioId && u.role === role);
    },
    starBalance(userId) {
      return db.stars.filter((s) => s.userId === userId).reduce((a, s) => a + s.delta, 0);
    },
    membership(userId) {
      const ups = db.userPackages.filter((p) => p.userId === userId);
      if (!ups.length) {
        return { state: 'none', planName: null, creditsLeft: 0, expiresAt: null, daysLeft: 0 };
      }
      const up = ups.slice().sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt))[0];
      const pkg = db.packages.find((p) => p.id === up.packageId);
      const daysLeft = daysUntil(up.expiresAt);
      const creditsLeft = up.creditsTotal - up.creditsUsed;
      let state: MembershipState;
      if (daysLeft <= 0 || creditsLeft <= 0) state = 'expired';
      else if (daysLeft <= 7) state = 'expiring';
      else state = 'active';
      return { state, planName: pkg?.name ?? null, creditsLeft, expiresAt: up.expiresAt, daysLeft };
    },

    bookSession(sessionId) {
      if (!currentUser) return;
      setDb((prev) => {
        const already = prev.bookings.find(
          (b) => b.userId === currentUser.id && b.sessionId === sessionId && b.status !== 'CANCELED',
        );
        if (already) return prev;
        const session = prev.classSessions.find((s) => s.id === sessionId);
        if (!session) return prev;
        const seats =
          session.capacity -
          prev.bookings.filter((b) => b.sessionId === sessionId && b.status !== 'CANCELED').length;
        if (seats <= 0) return prev;
        const activePkg = prev.userPackages.find(
          (p) => p.userId === currentUser.id && p.active && p.creditsUsed < p.creditsTotal,
        );
        const booking: Booking = {
          id: nextId('bk'),
          userId: currentUser.id,
          sessionId,
          userPackageId: activePkg?.id ?? null,
          status: 'RESERVED',
          createdAt: new Date().toISOString(),
        };
        return {
          ...prev,
          bookings: [...prev.bookings, booking],
          userPackages: activePkg
            ? prev.userPackages.map((p) =>
                p.id === activePkg.id ? { ...p, creditsUsed: p.creditsUsed + 1 } : p,
              )
            : prev.userPackages,
        };
      });
    },
    cancelBooking(bookingId) {
      setDb((prev) => {
        const booking = prev.bookings.find((b) => b.id === bookingId);
        if (!booking) return prev;
        return {
          ...prev,
          bookings: prev.bookings.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELED' } : b)),
          userPackages: booking.userPackageId
            ? prev.userPackages.map((p) =>
                p.id === booking.userPackageId ? { ...p, creditsUsed: Math.max(0, p.creditsUsed - 1) } : p,
              )
            : prev.userPackages,
        };
      });
    },

    buyPackageOnline(packageId, method) {
      if (!currentUser) return;
      applyPurchase(setDb, currentUser.id, packageId, method, 'online');
    },
    registerManualPlan(userId, packageId, method) {
      applyPurchase(setDb, userId, packageId, method, 'studio');
    },

    redeemReward(rewardId) {
      if (!currentUser) return;
      setDb((prev) => {
        const reward = prev.rewards.find((r) => r.id === rewardId);
        if (!reward) return prev;
        const balance = prev.stars
          .filter((s) => s.userId === currentUser.id)
          .reduce((a, s) => a + s.delta, 0);
        if (balance < reward.starCost) return prev;
        return {
          ...prev,
          stars: [
            ...prev.stars,
            { id: nextId('st'), userId: currentUser.id, delta: -reward.starCost, reason: 'redemption', createdAt: new Date().toISOString() },
          ],
        };
      });
    },

    upsertPackage(pkg) {
      setDb((prev) => {
        const exists = prev.packages.some((p) => p.id === pkg.id);
        return {
          ...prev,
          packages: exists
            ? prev.packages.map((p) => (p.id === pkg.id ? pkg : p))
            : [...prev.packages, { ...pkg, id: nextId('pkg') }],
        };
      });
    },
    togglePackageActive(packageId) {
      setDb((prev) => ({
        ...prev,
        packages: prev.packages.map((p) => (p.id === packageId ? { ...p, active: !p.active } : p)),
      }));
    },

    upsertClassTemplate(tpl) {
      setDb((prev) => {
        const exists = prev.classTemplates.some((t) => t.id === tpl.id);
        return {
          ...prev,
          classTemplates: exists
            ? prev.classTemplates.map((t) => (t.id === tpl.id ? tpl : t))
            : [...prev.classTemplates, { ...tpl, id: nextId('ct') }],
        };
      });
    },
    deleteClassTemplate(id) {
      setDb((prev) => ({
        ...prev,
        classTemplates: prev.classTemplates.filter((t) => t.id !== id),
        classSessions: prev.classSessions.filter((s) => s.templateId !== id),
        packages: prev.packages.map((p) => ({
          ...p,
          eligibleClassIds: p.eligibleClassIds.filter((c) => c !== id),
        })),
      }));
    },
    upsertSession(s) {
      setDb((prev) => {
        const exists = prev.classSessions.some((x) => x.id === s.id);
        return {
          ...prev,
          classSessions: exists
            ? prev.classSessions.map((x) => (x.id === s.id ? s : x))
            : [...prev.classSessions, { ...s, id: nextId('cs') }],
        };
      });
    },
    deleteSession(id) {
      setDb((prev) => ({
        ...prev,
        classSessions: prev.classSessions.filter((s) => s.id !== id),
        bookings: prev.bookings.filter((b) => b.sessionId !== id),
      }));
    },

    setCoachStatus(userId, status) {
      setDb((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === userId ? { ...u, coachStatus: status } : u)),
      }));
    },
    upsertCoach(coach) {
      setDb((prev) => {
        const exists = prev.users.some((u) => u.id === coach.id);
        return {
          ...prev,
          users: exists
            ? prev.users.map((u) => (u.id === coach.id ? coach : u))
            : [...prev.users, { ...coach, id: nextId('user') }],
        };
      });
    },
    updateUserAvatar(userId, avatarUrl) {
      setDb((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === userId ? { ...u, avatarUrl } : u)),
      }));
    },

    addService(name, description) {
      patchStudio((s) => ({
        ...s,
        services: [
          ...s.services,
          { id: nextId('sv'), name, description, enabled: true, custom: true },
        ],
      }));
    },
    updateService(id, patch) {
      patchStudio((s) => ({
        ...s,
        services: s.services.map((sv) => (sv.id === id ? { ...sv, ...patch } : sv)),
      }));
    },
    removeService(id) {
      patchStudio((s) => ({ ...s, services: s.services.filter((sv) => sv.id !== id) }));
    },

    upsertReward(reward) {
      setDb((prev) => {
        const exists = prev.rewards.some((r) => r.id === reward.id);
        return {
          ...prev,
          rewards: exists
            ? prev.rewards.map((r) => (r.id === reward.id ? reward : r))
            : [...prev.rewards, { ...reward, id: nextId('rw') }],
        };
      });
    },
    deleteReward(id) {
      setDb((prev) => ({ ...prev, rewards: prev.rewards.filter((r) => r.id !== id) }));
    },

    updateStudio(patch) {
      patchStudio((s) => ({ ...s, ...patch }));
    },
    updateBranding(patch) {
      patchStudio((s) => ({ ...s, branding: { ...s.branding, ...patch } }));
    },
    updateWhatsapp(patch) {
      patchStudio((s) => ({ ...s, whatsapp: { ...s.whatsapp, ...patch } }));
    },
    upsertWhatsappTemplate(t) {
      patchStudio((s) => {
        const exists = s.whatsapp.templates.some((x) => x.id === t.id);
        return {
          ...s,
          whatsapp: {
            ...s.whatsapp,
            templates: exists
              ? s.whatsapp.templates.map((x) => (x.id === t.id ? t : x))
              : [...s.whatsapp.templates, { ...t, id: nextId('wt') }],
          },
        };
      });
    },
    deleteWhatsappTemplate(id) {
      patchStudio((s) => ({
        ...s,
        whatsapp: { ...s.whatsapp, templates: s.whatsapp.templates.filter((t) => t.id !== id) },
      }));
    },
    addKnowledge(text) {
      patchStudio((s) => ({ ...s, whatsapp: { ...s.whatsapp, knowledge: [...s.whatsapp.knowledge, text] } }));
    },
    removeKnowledge(index) {
      patchStudio((s) => ({
        ...s,
        whatsapp: { ...s.whatsapp, knowledge: s.whatsapp.knowledge.filter((_, i) => i !== index) },
      }));
    },

    markSubscriptionPaid() {
      const end = new Date();
      end.setDate(end.getDate() + 30);
      patchStudio((s) => ({
        ...s,
        subscription: { ...s.subscription, status: 'ACTIVE', currentPeriodEnd: end.toISOString() },
      }));
    },
    setSubscriptionPastDue() {
      patchStudio((s) => ({ ...s, subscription: { ...s.subscription, status: 'PAST_DUE' } }));
    },
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

// Compra/registro de un plan: crea UserPackage + Payment.
function applyPurchase(
  setDb: React.Dispatch<React.SetStateAction<Database>>,
  userId: string,
  packageId: string,
  method: PaymentMethod,
  registeredBy: 'studio' | 'online',
) {
  setDb((prev) => {
    const pkg = prev.packages.find((p) => p.id === packageId);
    if (!pkg) return prev;
    const expires = new Date();
    expires.setDate(expires.getDate() + pkg.validityDays);
    const upId = nextId('up');
    const payment: Payment = {
      id: nextId('pay'),
      userId,
      amountUsd: pkg.priceUsd,
      method,
      packageId: pkg.id,
      concept: pkg.name,
      paidAt: new Date().toISOString(),
      registeredBy,
    };
    return {
      ...prev,
      userPackages: [
        ...prev.userPackages,
        {
          id: upId,
          userId,
          packageId: pkg.id,
          creditsTotal: pkg.classCredits,
          creditsUsed: 0,
          purchasedAt: new Date().toISOString(),
          expiresAt: expires.toISOString(),
          active: true,
        },
      ],
      payments: [...prev.payments, payment],
    };
  });
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore debe usarse dentro de <StoreProvider>');
  return ctx;
}

export function isSubscriptionActive(studio: Studio | null): boolean {
  if (!studio) return false;
  const { status, currentPeriodEnd } = studio.subscription;
  if (status === 'PAST_DUE' || status === 'CANCELED') return false;
  return new Date(currentPeriodEnd).getTime() > Date.now();
}

// Genera una respuesta simulada del bot con base en la retro/conocimiento.
export function botReply(question: string, knowledge: string[]): string {
  const q = question.toLowerCase();
  const hit = knowledge.find((k) => {
    const words = k.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
    return words.some((w) => q.includes(w));
  });
  if (hit) return hit;
  if (/hola|buenas|buenos/.test(q)) return '¡Hola! 👋 ¿En qué te puedo ayudar hoy?';
  if (/gracias/.test(q)) return '¡Con gusto! Aquí estamos para lo que necesites. 🙌';
  return 'Gracias por tu mensaje. Un miembro del estudio te responderá en breve. Mientras tanto, ¿te ayudo con horarios, pagos o reservas?';
}
