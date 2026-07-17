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
  Database,
  Package,
  ServiceConfig,
  Studio,
  User,
} from './types';
import { seedDatabase } from './mockData';

const STORAGE_KEY = 'moveya_db_v1';
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
  // Alumno
  bookSession: (sessionId: string) => void;
  cancelBooking: (bookingId: string) => void;
  buyPackage: (packageId: string) => void;
  redeemReward: (rewardId: string) => void;
  // Admin
  upsertPackage: (pkg: Package) => void;
  togglePackageActive: (packageId: string) => void;
  updateBranding: (patch: Partial<Branding>) => void;
  updateServiceConfig: (patch: Partial<ServiceConfig>) => void;
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

  // Persistencia
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

  // Aplica branding (white-label) a las CSS vars en vivo.
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
      const fresh = seedDatabase();
      setDb(fresh);
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
      return db.users.filter(
        (u) => u.studioId === currentUser?.studioId && u.role === role,
      );
    },

    starBalance(userId) {
      return db.stars
        .filter((s) => s.userId === userId)
        .reduce((acc, s) => acc + s.delta, 0);
    },

    bookSession(sessionId) {
      if (!currentUser) return;
      setDb((prev) => {
        const already = prev.bookings.find(
          (b) =>
            b.userId === currentUser.id &&
            b.sessionId === sessionId &&
            b.status !== 'CANCELED',
        );
        if (already) return prev;
        const seats =
          prev.classSessions.find((s) => s.id === sessionId)!.capacity -
          prev.bookings.filter((b) => b.sessionId === sessionId && b.status !== 'CANCELED')
            .length;
        if (seats <= 0) return prev;

        // Consume un crédito del paquete activo (si existe).
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
          bookings: prev.bookings.map((b) =>
            b.id === bookingId ? { ...b, status: 'CANCELED' } : b,
          ),
          // Devuelve el crédito si aplicaba.
          userPackages: booking.userPackageId
            ? prev.userPackages.map((p) =>
                p.id === booking.userPackageId
                  ? { ...p, creditsUsed: Math.max(0, p.creditsUsed - 1) }
                  : p,
              )
            : prev.userPackages,
        };
      });
    },

    buyPackage(packageId) {
      if (!currentUser) return;
      setDb((prev) => {
        const pkg = prev.packages.find((p) => p.id === packageId);
        if (!pkg) return prev;
        const expires = new Date();
        expires.setDate(expires.getDate() + pkg.validityDays);
        return {
          ...prev,
          userPackages: [
            ...prev.userPackages,
            {
              id: nextId('up'),
              userId: currentUser.id,
              packageId: pkg.id,
              creditsTotal: pkg.classCredits,
              creditsUsed: 0,
              purchasedAt: new Date().toISOString(),
              expiresAt: expires.toISOString(),
              active: true,
            },
          ],
        };
      });
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
            {
              id: nextId('st'),
              userId: currentUser.id,
              delta: -reward.starCost,
              reason: 'redemption',
              createdAt: new Date().toISOString(),
            },
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
        packages: prev.packages.map((p) =>
          p.id === packageId ? { ...p, active: !p.active } : p,
        ),
      }));
    },

    updateBranding(patch) {
      setDb((prev) => ({
        ...prev,
        studios: prev.studios.map((s) =>
          s.id === currentUser?.studioId
            ? { ...s, branding: { ...s.branding, ...patch } }
            : s,
        ),
      }));
    },

    updateServiceConfig(patch) {
      setDb((prev) => ({
        ...prev,
        studios: prev.studios.map((s) =>
          s.id === currentUser?.studioId
            ? { ...s, serviceConfig: { ...s.serviceConfig, ...patch } }
            : s,
        ),
      }));
    },

    markSubscriptionPaid() {
      const end = new Date();
      end.setDate(end.getDate() + 30);
      setDb((prev) => ({
        ...prev,
        studios: prev.studios.map((s) =>
          s.id === currentUser?.studioId
            ? {
                ...s,
                subscription: {
                  ...s.subscription,
                  status: 'ACTIVE',
                  currentPeriodEnd: end.toISOString(),
                },
              }
            : s,
        ),
      }));
    },

    setSubscriptionPastDue() {
      setDb((prev) => ({
        ...prev,
        studios: prev.studios.map((s) =>
          s.id === currentUser?.studioId
            ? { ...s, subscription: { ...s.subscription, status: 'PAST_DUE' } }
            : s,
        ),
      }));
    },
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore debe usarse dentro de <StoreProvider>');
  return ctx;
}

// Determina si el panel del Estudio está desbloqueado (pago mensual vigente).
export function isSubscriptionActive(studio: Studio | null): boolean {
  if (!studio) return false;
  const { status, currentPeriodEnd } = studio.subscription;
  if (status === 'PAST_DUE' || status === 'CANCELED') return false;
  return new Date(currentPeriodEnd).getTime() > Date.now();
}
