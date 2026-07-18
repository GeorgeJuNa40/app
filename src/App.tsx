import { Navigate, Route, Routes } from 'react-router-dom';
import { useStore } from './lib/store';
import type { Role } from './lib/types';
import AppShell from './components/layout/AppShell';

import OnboardingScreen from './features/onboarding/OnboardingScreen';

import AdminDashboard from './features/admin/AdminDashboard';
import MembersCRM from './features/admin/MembersCRM';
import CalendarAdmin from './features/admin/CalendarAdmin';
import ClassesManagement from './features/admin/ClassesManagement';
import PackageManagement from './features/admin/PackageManagement';
import CoachesAdmin from './features/admin/CoachesAdmin';
import RewardsAdmin from './features/admin/RewardsAdmin';
import ServicesConfig from './features/admin/ServicesConfig';
import WhatsappAgent from './features/admin/WhatsappAgent';
import Reports from './features/admin/Reports';
import SubscriptionScreen from './features/admin/SubscriptionScreen';
import Settings from './features/admin/Settings';
import SubscriptionGate from './features/admin/SubscriptionGate';

import CoachDashboard from './features/coach/CoachDashboard';
import CoachCalendar from './features/coach/CoachCalendar';
import CoachProfile from './features/coach/CoachProfile';

import StudentDashboard from './features/student/StudentDashboard';
import BookClasses from './features/student/BookClasses';
import MyPackages from './features/student/MyPackages';
import Rewards from './features/student/Rewards';
import OptionalServices from './features/student/OptionalServices';
import Goals from './features/student/Goals';

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
  const { currentUser } = useStore();

  return (
    <Routes>
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
      <Route path="/admin" element={<RequireRole role="STUDIO_ADMIN"><SubscriptionGate><AdminDashboard /></SubscriptionGate></RequireRole>} />
      <Route path="/admin/members" element={<RequireRole role="STUDIO_ADMIN"><SubscriptionGate><MembersCRM /></SubscriptionGate></RequireRole>} />
      <Route path="/admin/calendar" element={<RequireRole role="STUDIO_ADMIN"><SubscriptionGate><CalendarAdmin /></SubscriptionGate></RequireRole>} />
      <Route path="/admin/classes" element={<RequireRole role="STUDIO_ADMIN"><SubscriptionGate><ClassesManagement /></SubscriptionGate></RequireRole>} />
      <Route path="/admin/packages" element={<RequireRole role="STUDIO_ADMIN"><SubscriptionGate><PackageManagement /></SubscriptionGate></RequireRole>} />
      <Route path="/admin/coaches" element={<RequireRole role="STUDIO_ADMIN"><SubscriptionGate><CoachesAdmin /></SubscriptionGate></RequireRole>} />
      <Route path="/admin/rewards" element={<RequireRole role="STUDIO_ADMIN"><SubscriptionGate><RewardsAdmin /></SubscriptionGate></RequireRole>} />
      <Route path="/admin/services" element={<RequireRole role="STUDIO_ADMIN"><SubscriptionGate><ServicesConfig /></SubscriptionGate></RequireRole>} />
      <Route path="/admin/whatsapp" element={<RequireRole role="STUDIO_ADMIN"><SubscriptionGate><WhatsappAgent /></SubscriptionGate></RequireRole>} />
      <Route path="/admin/reports" element={<RequireRole role="STUDIO_ADMIN"><SubscriptionGate><Reports /></SubscriptionGate></RequireRole>} />
      {/* Suscripción siempre accesible (allow) para poder regularizar el pago. */}
      <Route path="/admin/subscription" element={<RequireRole role="STUDIO_ADMIN"><SubscriptionGate allow><SubscriptionScreen /></SubscriptionGate></RequireRole>} />
      <Route path="/admin/settings" element={<RequireRole role="STUDIO_ADMIN"><SubscriptionGate><Settings /></SubscriptionGate></RequireRole>} />

      {/* ---- COACH ---- */}
      <Route path="/coach" element={<RequireRole role="COACH"><CoachDashboard /></RequireRole>} />
      <Route path="/coach/calendar" element={<RequireRole role="COACH"><CoachCalendar /></RequireRole>} />
      <Route path="/coach/profile" element={<RequireRole role="COACH"><CoachProfile /></RequireRole>} />

      {/* ---- USUARIO (Alumno) ---- */}
      <Route path="/app" element={<RequireRole role="STUDENT"><StudentDashboard /></RequireRole>} />
      <Route path="/app/book" element={<RequireRole role="STUDENT"><BookClasses /></RequireRole>} />
      <Route path="/app/packages" element={<RequireRole role="STUDENT"><MyPackages /></RequireRole>} />
      <Route path="/app/rewards" element={<RequireRole role="STUDENT"><Rewards /></RequireRole>} />
      <Route path="/app/services" element={<RequireRole role="STUDENT"><OptionalServices /></RequireRole>} />
      <Route path="/app/goals" element={<RequireRole role="STUDENT"><Goals /></RequireRole>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
