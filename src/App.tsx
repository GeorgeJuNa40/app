import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useStore } from './lib/store';
import { isSupabaseConfigured } from './lib/supabase';
import { notifySuccess, triggerResync } from './lib/notify';
import type { Role } from './lib/types';
import AppShell from './components/layout/AppShell';
// Los "gates" (verificaciones de pago/estado) son ligeros y se cargan de una vez.
import SubscriptionGate from './features/admin/SubscriptionGate';
import PlanGate from './features/admin/PlanGate';
import CoachGate from './features/coach/CoachGate';

// Cada pantalla se carga bajo demanda (code-splitting) para aligerar la carga
// inicial: el navegador solo descarga el código de la sección que se abre.
const OnboardingScreen = lazy(() => import('./features/onboarding/OnboardingScreen'));
// Página pública informativa del estudio (sin login).
const StudioInfoPage = lazy(() => import('./features/public/StudioInfoPage'));
// Página pública de política de privacidad (sin login) — para publicar en Meta.
const PrivacyPolicy = lazy(() => import('./features/public/PrivacyPolicy'));

const AdminDashboard = lazy(() => import('./features/admin/AdminDashboard'));
const MembersCRM = lazy(() => import('./features/admin/MembersCRM'));
const CalendarAdmin = lazy(() => import('./features/admin/CalendarAdmin'));
const ClassesManagement = lazy(() => import('./features/admin/ClassesManagement'));
const PackageManagement = lazy(() => import('./features/admin/PackageManagement'));
const CoachesAdmin = lazy(() => import('./features/admin/CoachesAdmin'));
const RewardsAdmin = lazy(() => import('./features/admin/RewardsAdmin'));
const ServicesConfig = lazy(() => import('./features/admin/ServicesConfig'));
const WhatsappAgent = lazy(() => import('./features/admin/WhatsappAgent'));
const Reports = lazy(() => import('./features/admin/Reports'));
const Reminders = lazy(() => import('./features/admin/Reminders'));
const SubscriptionScreen = lazy(() => import('./features/admin/SubscriptionScreen'));
const Settings = lazy(() => import('./features/admin/Settings'));

const CoachDashboard = lazy(() => import('./features/coach/CoachDashboard'));
const CoachCalendar = lazy(() => import('./features/coach/CoachCalendar'));
const CoachProfile = lazy(() => import('./features/coach/CoachProfile'));

const StudentDashboard = lazy(() => import('./features/student/StudentDashboard'));
const BookClasses = lazy(() => import('./features/student/BookClasses'));
const MyPackages = lazy(() => import('./features/student/MyPackages'));
const Rewards = lazy(() => import('./features/student/Rewards'));
const OptionalServices = lazy(() => import('./features/student/OptionalServices'));
const StudentCoaches = lazy(() => import('./features/student/StudentCoaches'));

// Pantalla de carga mientras se descarga el código de una sección.
function Splash() {
  return (
    <div className="min-h-screen grid place-items-center bg-cream">
      <div className="text-2xl font-black text-brand animate-pulse">Move yA</div>
    </div>
  );
}

// Guarda de rol: redirige al onboarding si no hay sesión o el rol no coincide.
function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  const { currentUser } = useStore();
  if (!currentUser) return <Navigate to="/" replace />;
  if (currentUser.role !== role) {
    const home =
      currentUser.role === 'STUDIO_ADMIN'
        ? '/admin'
        : currentUser.role === 'COACH'
          ? '/coach'
          : '/app';
    return <Navigate to={home} replace />;
  }
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  const { currentUser, authLoading } = useStore();

  // Al volver de Stripe (?pago=exito / ?suscripcion=exito): avisa y refresca los
  // datos (el webhook ya creó el registro en el servidor).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pago = params.get('pago');
    const susc = params.get('suscripcion');
    if (!pago && !susc) return;
    if (pago === 'exito') {
      notifySuccess('¡Pago recibido! Tu paquete se activa en unos segundos.');
      setTimeout(triggerResync, 3000);
    } else if (susc === 'exito') {
      notifySuccess('¡Suscripción activada! Bienvenido a tu plan.');
      setTimeout(triggerResync, 3000);
    }
    // Limpia el query para que el aviso no se repita al recargar.
    window.history.replaceState({}, '', window.location.pathname + window.location.hash);
  }, []);

  // Si faltan las llaves de conexión, avisa claramente (en vez de "Failed to fetch").
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen grid place-items-center bg-cream p-6 text-center">
        <div className="max-w-md">
          <h1 className="mb-3 text-2xl font-black text-brand">Move yA</h1>
          <p className="text-ink">Falta configurar las llaves de conexión en Vercel.</p>
          <p className="mt-3 text-sm text-ink-soft">
            En Vercel → <b>Settings → Environment Variables</b>, agrega{' '}
            <b>VITE_SUPABASE_URL</b> y <b>VITE_SUPABASE_ANON_KEY</b>, marca{' '}
            <b>Production</b>, y vuelve a publicar (<b>Redeploy</b>).
          </p>
        </div>
      </div>
    );
  }

  // Mientras se verifica la sesión, muestra una pantalla de carga simple.
  if (authLoading) {
    return <Splash />;
  }

  return (
    <Suspense fallback={<Splash />}>
    <Routes>
      {/* Página informativa PÚBLICA del estudio (sin login). */}
      <Route path="/info/:ceu" element={<StudioInfoPage />} />
      {/* Política de privacidad PÚBLICA (sin login) — requerida para publicar en Meta. */}
      <Route path="/privacy" element={<PrivacyPolicy />} />

      {/* Onboarding: pantalla de inicio con CEU. Si ya hay sesión, redirige. */}
      <Route
        path="/"
        element={
          currentUser ? (
            <Navigate
              to={
                currentUser.role === 'STUDIO_ADMIN'
                  ? '/admin'
                  : currentUser.role === 'COACH'
                    ? '/coach'
                    : '/app'
              }
              replace
            />
          ) : (
            <OnboardingScreen />
          )
        }
      />

      {/* ---- ESTUDIO (Admin) — protegido por verificación de pago ---- */}
      {/* Dashboard siempre visible: aunque no haya pago, el estudio puede entrar a su panel principal. */}
      <Route path="/admin" element={<RequireRole role="STUDIO_ADMIN"><SubscriptionGate allow><AdminDashboard /></SubscriptionGate></RequireRole>} />
      <Route path="/admin/members" element={<RequireRole role="STUDIO_ADMIN"><SubscriptionGate><MembersCRM /></SubscriptionGate></RequireRole>} />
      <Route path="/admin/calendar" element={<RequireRole role="STUDIO_ADMIN"><SubscriptionGate><CalendarAdmin /></SubscriptionGate></RequireRole>} />
      <Route path="/admin/classes" element={<RequireRole role="STUDIO_ADMIN"><SubscriptionGate><ClassesManagement /></SubscriptionGate></RequireRole>} />
      <Route path="/admin/packages" element={<RequireRole role="STUDIO_ADMIN"><SubscriptionGate><PackageManagement /></SubscriptionGate></RequireRole>} />
      <Route path="/admin/coaches" element={<RequireRole role="STUDIO_ADMIN"><SubscriptionGate><CoachesAdmin /></SubscriptionGate></RequireRole>} />
      <Route path="/admin/rewards" element={<RequireRole role="STUDIO_ADMIN"><SubscriptionGate><PlanGate capability="rewards"><RewardsAdmin /></PlanGate></SubscriptionGate></RequireRole>} />
      <Route path="/admin/services" element={<RequireRole role="STUDIO_ADMIN"><SubscriptionGate><PlanGate capability="services"><ServicesConfig /></PlanGate></SubscriptionGate></RequireRole>} />
      <Route path="/admin/whatsapp" element={<RequireRole role="STUDIO_ADMIN"><SubscriptionGate><PlanGate capability="whatsapp"><WhatsappAgent /></PlanGate></SubscriptionGate></RequireRole>} />
      <Route path="/admin/reports" element={<RequireRole role="STUDIO_ADMIN"><SubscriptionGate><PlanGate capability="reports"><Reports /></PlanGate></SubscriptionGate></RequireRole>} />
      <Route path="/admin/reminders" element={<RequireRole role="STUDIO_ADMIN"><SubscriptionGate><Reminders /></SubscriptionGate></RequireRole>} />
      {/* Suscripción siempre accesible (allow) para poder regularizar el pago. */}
      <Route path="/admin/subscription" element={<RequireRole role="STUDIO_ADMIN"><SubscriptionGate allow><SubscriptionScreen /></SubscriptionGate></RequireRole>} />
      <Route path="/admin/settings" element={<RequireRole role="STUDIO_ADMIN"><SubscriptionGate><Settings /></SubscriptionGate></RequireRole>} />

      {/* ---- COACH — protegido por estado de aprobación ---- */}
      <Route path="/coach" element={<RequireRole role="COACH"><CoachGate><CoachDashboard /></CoachGate></RequireRole>} />
      <Route path="/coach/calendar" element={<RequireRole role="COACH"><CoachGate><CoachCalendar /></CoachGate></RequireRole>} />
      <Route path="/coach/profile" element={<RequireRole role="COACH"><CoachGate><CoachProfile /></CoachGate></RequireRole>} />

      {/* ---- USUARIO (Alumno) ---- */}
      <Route path="/app" element={<RequireRole role="STUDENT"><StudentDashboard /></RequireRole>} />
      <Route path="/app/book" element={<RequireRole role="STUDENT"><BookClasses /></RequireRole>} />
      <Route path="/app/packages" element={<RequireRole role="STUDENT"><MyPackages /></RequireRole>} />
      <Route path="/app/rewards" element={<RequireRole role="STUDENT"><Rewards /></RequireRole>} />
      <Route path="/app/coaches" element={<RequireRole role="STUDENT"><StudentCoaches /></RequireRole>} />
      <Route path="/app/services" element={<RequireRole role="STUDENT"><OptionalServices /></RequireRole>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}
