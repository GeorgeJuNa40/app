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
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import {
  loadDatabase,
  emptyDatabase,
  persistStudio,
  dbInsert,
  dbUpsert,
  dbUpdate,
  dbDelete,
  dbDeleteWhere,
  rowBooking,
  rowUserPackage,
  rowPayment,
  rowStar,
  rowPackage,
  rowClassTemplate,
  rowClassSession,
  rowReward,
  rowUser,
} from './repo';

// Datos que se envían al registrarse.
export interface SignUpInput {
  fullName: string;
  email: string;
  password: string;
  ceuCode?: string; // para unirse a un estudio existente como ALUMNO
  studioName?: string; // para crear un estudio nuevo (ADMIN)
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
  authLoading: boolean;
  signUp: (input: SignUpInput) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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
  activatePromo: () => void;
  markSubscriptionPaid: () => void;
  setSubscriptionPastDue: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

// IDs reales (UUID) para que coincidan con la base de datos.
const newId = () => crypto.randomUUID();

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(emptyDatabase);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Escucha la sesión de Supabase (inicio/cierre) y la mantiene al recargar.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const currentUserId = session?.user?.id ?? null;

  // Cuando hay sesión, carga los datos del estudio desde Supabase.
  useEffect(() => {
    let cancelled = false;
    if (currentUserId) {
      setAuthLoading(true);
      loadDatabase()
        .then((data) => {
          if (!cancelled) setDb(data);
        })
        .finally(() => {
          if (!cancelled) setAuthLoading(false);
        });
    } else {
      setDb(emptyDatabase());
      setAuthLoading(false);
    }
    return () => {
      cancelled = true;
    };
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

  // Helper: modifica el estudio actual (local) y lo guarda en Supabase.
  const patchStudio = (fn: (s: Studio) => Studio) => {
    if (!currentStudio) return;
    const next = fn(currentStudio);
    setDb((prev) => ({
      ...prev,
      studios: prev.studios.map((s) => (s.id === next.id ? next : s)),
    }));
    void persistStudio(next);
  };

  const value: StoreValue = {
    db,
    currentUser,
    currentStudio,
    authLoading,

    async signUp(input) {
      const { error } = await supabase.auth.signUp({
        email: input.email.trim(),
        password: input.password,
        options: {
          data: {
            full_name: input.fullName.trim(),
            ...(input.ceuCode ? { ceu_code: input.ceuCode.trim() } : {}),
            ...(input.studioName ? { studio_name: input.studioName.trim() } : {}),
          },
        },
      });
      if (error) throw error;
    },
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
    },
    async logout() {
      await supabase.auth.signOut();
    },

    seatsLeft(sessionId) {
      const s = db.classSessions.find((x) => x.id === sessionId);
      if (!s) return 0;
      const taken = db.bookings.filter(
        (b) => b.sessionId === sessionId && b.status !== 'CANCELED',
      ).length;
      return Math.max(0, s.capacity - taken);
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
      const already = db.bookings.find(
        (b) => b.userId === currentUser.id && b.sessionId === sessionId && b.status !== 'CANCELED',
      );
      if (already) return;
      const s = db.classSessions.find((x) => x.id === sessionId);
      if (!s) return;
      const seats =
        s.capacity -
        db.bookings.filter((b) => b.sessionId === sessionId && b.status !== 'CANCELED').length;
      if (seats <= 0) return;
      const activePkg = db.userPackages.find(
        (p) => p.userId === currentUser.id && p.active && p.creditsUsed < p.creditsTotal,
      );
      const booking: Booking = {
        id: newId(),
        userId: currentUser.id,
        sessionId,
        userPackageId: activePkg?.id ?? null,
        status: 'RESERVED',
        createdAt: new Date().toISOString(),
      };
      setDb((prev) => ({
        ...prev,
        bookings: [...prev.bookings, booking],
        userPackages: activePkg
          ? prev.userPackages.map((p) =>
              p.id === activePkg.id ? { ...p, creditsUsed: p.creditsUsed + 1 } : p,
            )
          : prev.userPackages,
      }));
      void dbInsert('bookings', rowBooking(booking));
      if (activePkg) void dbUpdate('user_packages', activePkg.id, { credits_used: activePkg.creditsUsed + 1 });
    },
    cancelBooking(bookingId) {
      const booking = db.bookings.find((b) => b.id === bookingId);
      if (!booking) return;
      setDb((prev) => ({
        ...prev,
        bookings: prev.bookings.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELED' } : b)),
        userPackages: booking.userPackageId
          ? prev.userPackages.map((p) =>
              p.id === booking.userPackageId ? { ...p, creditsUsed: Math.max(0, p.creditsUsed - 1) } : p,
            )
          : prev.userPackages,
      }));
      void dbUpdate('bookings', bookingId, { status: 'CANCELED' });
      if (booking.userPackageId) {
        const up = db.userPackages.find((p) => p.id === booking.userPackageId);
        if (up) void dbUpdate('user_packages', up.id, { credits_used: Math.max(0, up.creditsUsed - 1) });
      }
    },

    buyPackageOnline(packageId, method) {
      if (!currentUser) return;
      applyPurchase(setDb, db, currentUser.id, packageId, method, 'online');
    },
    registerManualPlan(userId, packageId, method) {
      applyPurchase(setDb, db, userId, packageId, method, 'studio');
    },

    redeemReward(rewardId) {
      if (!currentUser) return;
      const reward = db.rewards.find((r) => r.id === rewardId);
      if (!reward) return;
      const balance = db.stars
        .filter((s) => s.userId === currentUser.id)
        .reduce((a, s) => a + s.delta, 0);
      if (balance < reward.starCost) return;
      const entry = {
        id: newId(),
        userId: currentUser.id,
        delta: -reward.starCost,
        reason: 'redemption' as const,
        createdAt: new Date().toISOString(),
      };
      setDb((prev) => ({ ...prev, stars: [...prev.stars, entry] }));
      void dbInsert('star_entries', rowStar(entry));
    },

    upsertPackage(pkg) {
      const studioId = currentUser?.studioId;
      if (!studioId) return;
      const exists = db.packages.some((p) => p.id === pkg.id);
      const row: Package = exists ? pkg : { ...pkg, id: newId(), studioId };
      setDb((prev) => ({
        ...prev,
        packages: exists
          ? prev.packages.map((p) => (p.id === row.id ? row : p))
          : [...prev.packages, row],
      }));
      void dbUpsert('packages', rowPackage(row));
    },
    togglePackageActive(packageId) {
      const p = db.packages.find((x) => x.id === packageId);
      if (!p) return;
      const active = !p.active;
      setDb((prev) => ({
        ...prev,
        packages: prev.packages.map((x) => (x.id === packageId ? { ...x, active } : x)),
      }));
      void dbUpdate('packages', packageId, { active });
    },

    upsertClassTemplate(tpl) {
      const studioId = currentUser?.studioId;
      if (!studioId) return;
      const exists = db.classTemplates.some((t) => t.id === tpl.id);
      const row: ClassTemplate = exists ? tpl : { ...tpl, id: newId(), studioId };
      setDb((prev) => ({
        ...prev,
        classTemplates: exists
          ? prev.classTemplates.map((t) => (t.id === row.id ? row : t))
          : [...prev.classTemplates, row],
      }));
      void dbUpsert('class_templates', rowClassTemplate(row));
    },
    deleteClassTemplate(id) {
      const affected = db.packages.filter((p) => p.eligibleClassIds.includes(id));
      setDb((prev) => ({
        ...prev,
        classTemplates: prev.classTemplates.filter((t) => t.id !== id),
        classSessions: prev.classSessions.filter((s) => s.templateId !== id),
        packages: prev.packages.map((p) => ({
          ...p,
          eligibleClassIds: p.eligibleClassIds.filter((c) => c !== id),
        })),
      }));
      // Orden importante: primero las sesiones (por la relación), luego el tipo.
      void (async () => {
        await dbDeleteWhere('class_sessions', 'template_id', id);
        for (const p of affected) {
          await dbUpdate('packages', p.id, {
            eligible_class_ids: p.eligibleClassIds.filter((c) => c !== id),
          });
        }
        await dbDelete('class_templates', id);
      })();
    },
    upsertSession(s) {
      const studioId = currentUser?.studioId;
      if (!studioId) return;
      const exists = db.classSessions.some((x) => x.id === s.id);
      const row: ClassSession = exists ? s : { ...s, id: newId(), studioId };
      setDb((prev) => ({
        ...prev,
        classSessions: exists
          ? prev.classSessions.map((x) => (x.id === row.id ? row : x))
          : [...prev.classSessions, row],
      }));
      void dbUpsert('class_sessions', rowClassSession(row));
    },
    deleteSession(id) {
      setDb((prev) => ({
        ...prev,
        classSessions: prev.classSessions.filter((s) => s.id !== id),
        bookings: prev.bookings.filter((b) => b.sessionId !== id),
      }));
      void dbDelete('class_sessions', id); // las reservas se borran en cascada
    },

    setCoachStatus(userId, status) {
      setDb((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === userId ? { ...u, coachStatus: status } : u)),
      }));
      void dbUpdate('users', userId, { coach_status: status ?? null });
    },
    upsertCoach(coach) {
      const studioId = currentUser?.studioId;
      if (!studioId) return;
      const exists = db.users.some((u) => u.id === coach.id);
      const row: User = exists ? coach : { ...coach, id: newId(), studioId };
      setDb((prev) => ({
        ...prev,
        users: exists ? prev.users.map((u) => (u.id === row.id ? row : u)) : [...prev.users, row],
      }));
      void dbUpsert('users', rowUser(row));
    },
    updateUserAvatar(userId, avatarUrl) {
      setDb((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === userId ? { ...u, avatarUrl } : u)),
      }));
      void dbUpdate('users', userId, { avatar_url: avatarUrl });
    },

    addService(name, description) {
      patchStudio((s) => ({
        ...s,
        services: [
          ...s.services,
          { id: newId(), name, description, enabled: true, custom: true },
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
      const studioId = currentUser?.studioId;
      if (!studioId) return;
      const exists = db.rewards.some((r) => r.id === reward.id);
      const row: Reward = exists ? reward : { ...reward, id: newId(), studioId };
      setDb((prev) => ({
        ...prev,
        rewards: exists ? prev.rewards.map((r) => (r.id === row.id ? row : r)) : [...prev.rewards, row],
      }));
      void dbUpsert('rewards', rowReward(row));
    },
    deleteReward(id) {
      setDb((prev) => ({ ...prev, rewards: prev.rewards.filter((r) => r.id !== id) }));
      void dbDelete('rewards', id);
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
              : [...s.whatsapp.templates, { ...t, id: newId() }],
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

    // Promo de lanzamiento: paga $1 y activa 14 días de prueba.
    activatePromo() {
      patchStudio((s) => {
        const end = new Date();
        end.setDate(end.getDate() + (s.subscription.trialDays || 14));
        return {
          ...s,
          subscription: {
            ...s.subscription,
            status: 'TRIALING',
            isPromo: true,
            trialEndsAt: end.toISOString(),
            currentPeriodEnd: end.toISOString(),
          },
        };
      });
    },
    markSubscriptionPaid() {
      patchStudio((s) => {
        const end = new Date();
        end.setDate(end.getDate() + 30);
        return {
          ...s,
          subscription: { ...s.subscription, status: 'ACTIVE', currentPeriodEnd: end.toISOString() },
        };
      });
    },
    setSubscriptionPastDue() {
      patchStudio((s) => ({ ...s, subscription: { ...s.subscription, status: 'PAST_DUE' } }));
    },
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

// Compra/registro de un plan: crea UserPackage + Payment (local + Supabase).
function applyPurchase(
  setDb: React.Dispatch<React.SetStateAction<Database>>,
  db: Database,
  userId: string,
  packageId: string,
  method: PaymentMethod,
  registeredBy: 'studio' | 'online',
) {
  const pkg = db.packages.find((p) => p.id === packageId);
  if (!pkg) return;
  const expires = new Date();
  expires.setDate(expires.getDate() + pkg.validityDays);
  const userPackage = {
    id: newId(),
    userId,
    packageId: pkg.id,
    creditsTotal: pkg.classCredits,
    creditsUsed: 0,
    purchasedAt: new Date().toISOString(),
    expiresAt: expires.toISOString(),
    active: true,
  };
  const payment: Payment = {
    id: newId(),
    userId,
    amountUsd: pkg.priceUsd,
    method,
    packageId: pkg.id,
    concept: pkg.name,
    paidAt: new Date().toISOString(),
    registeredBy,
  };
  setDb((prev) => ({
    ...prev,
    userPackages: [...prev.userPackages, userPackage],
    payments: [...prev.payments, payment],
  }));
  void dbInsert('user_packages', rowUserPackage(userPackage));
  void dbInsert('payments', rowPayment(payment));
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
