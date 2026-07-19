import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../../lib/store';
import type { Role } from '../../lib/types';
import Avatar from '../Avatar';
import ImageUpload from '../ImageUpload';
import StudioLogo from '../StudioLogo';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

// Rutas de navegación principales por rol.
const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  STUDIO_ADMIN: [
    { to: '/admin', label: 'Dashboard', icon: '◱' },
    { to: '/admin/members', label: 'Miembros (CRM)', icon: '⚇' },
    { to: '/admin/calendar', label: 'Calendario', icon: '▦' },
    { to: '/admin/classes', label: 'Clases', icon: '◉' },
    { to: '/admin/packages', label: 'Paquetes', icon: '❏' },
    { to: '/admin/coaches', label: 'Coaches', icon: '⚐' },
    { to: '/admin/rewards', label: 'Recompensas', icon: '★' },
    { to: '/admin/services', label: 'Servicios', icon: '✚' },
    { to: '/admin/whatsapp', label: 'WhatsApp IA', icon: '✆' },
    { to: '/admin/reports', label: 'Reportes', icon: '▤' },
    { to: '/admin/subscription', label: 'Suscripción', icon: '✦' },
    { to: '/admin/settings', label: 'Configuración', icon: '⚙' },
  ],
  COACH: [
    { to: '/coach', label: 'Dashboard', icon: '◱' },
    { to: '/coach/calendar', label: 'Mi Calendario', icon: '▦' },
    { to: '/coach/profile', label: 'Mi Perfil', icon: '⚇' },
  ],
  STUDENT: [
    { to: '/app', label: 'Inicio', icon: '◱' },
    { to: '/app/book', label: 'Reservar', icon: '▦' },
    { to: '/app/packages', label: 'Mis Paquetes', icon: '❏' },
    { to: '/app/rewards', label: 'Recompensas', icon: '★' },
    { to: '/app/services', label: 'Servicios', icon: '✚' },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  STUDIO_ADMIN: 'Estudio',
  COACH: 'Coach',
  STUDENT: 'Alumno',
};

export default function AppShell({ children }: { children: ReactNode }) {
  const { currentUser, currentStudio, logout, updateUserAvatar } = useStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!currentUser || !currentStudio) return null;
  const nav = NAV_BY_ROLE[currentUser.role];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-6 border-b border-cream-dark">
        <StudioLogo branding={currentStudio.branding} imgClass="h-10 max-w-[180px]" />
        <p className="text-xs text-ink-faint mt-1.5">
          powered by <span className="font-semibold">Move yA</span>
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin' || item.to === '/coach' || item.to === '/app'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand text-cream'
                  : 'text-ink-soft hover:bg-cream-dark'
              }`
            }
          >
            <span className="w-5 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-cream-dark p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar url={currentUser.avatarUrl} initials={currentUser.avatarInitials} className="h-9 w-9 text-sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{currentUser.fullName}</p>
            <p className="text-xs text-ink-faint">{ROLE_LABEL[currentUser.role]}</p>
          </div>
        </div>
        <ImageUpload
          label="Cambiar foto"
          className="w-full mb-2"
          onSelect={(url) => updateUserAvatar(currentUser.id, url)}
        />
        <button
          onClick={handleLogout}
          className="w-full rounded-xl px-3 py-2 text-sm text-ink-soft hover:bg-cream-dark text-left"
        >
          ⟲ Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-white border-r border-cream-dark lg:block">
        {SidebarContent}
      </aside>

      {/* Topbar mobile */}
      <header className="sticky top-0 z-20 flex items-center justify-between bg-white border-b border-cream-dark px-4 py-3 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-2xl text-brand"
          aria-label="Abrir menú"
        >
          ☰
        </button>
        <StudioLogo branding={currentStudio.branding} imgClass="h-8 max-w-[130px]" textClass="font-bold text-brand" />
        <Avatar url={currentUser.avatarUrl} initials={currentUser.avatarInitials} className="h-8 w-8 text-xs" />
      </header>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white">{SidebarContent}</aside>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
