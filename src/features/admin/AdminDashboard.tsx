import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../lib/store';
import { PageHeader, StatCard, Card, Badge, Button } from '../../components/ui';
import { fmtTime, fmtDay, daysUntil } from '../../lib/format';

export default function AdminDashboard() {
  const { db, currentStudio, seatsLeft } = useStore();

  const stats = useMemo(() => {
    const students = db.users.filter((u) => u.role === 'STUDENT').length;
    const activeBookings = db.bookings.filter((b) => b.status !== 'CANCELED').length;
    const revenue = db.payments.reduce((acc, p) => acc + p.amountUsd, 0);
    const upcoming = db.classSessions
      .filter((s) => new Date(s.startsAt).getTime() > Date.now())
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      .slice(0, 5);
    return { students, activeBookings, revenue, upcoming };
  }, [db]);

  const sub = currentStudio!.subscription;
  const daysLeft = daysUntil(sub.currentPeriodEnd);

  return (
    <>
      <PageHeader
        title={`Hola, ${currentStudio!.branding.logoText}`}
        subtitle="Resumen general de tu estudio"
      />

      {daysLeft <= 7 && (
        <Card className="mb-6 p-4 border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-amber-800">
              Tu suscripción se renueva en <strong>{daysLeft} días</strong>. Mantén tu
              acceso al día para no interrumpir el panel.
            </p>
            <Link to="/admin/subscription">
              <Button variant="secondary">Gestionar</Button>
            </Link>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <StatCard label="Alumnos activos" value={stats.students} icon="⚇" />
        <StatCard label="Reservas vigentes" value={stats.activeBookings} icon="▦" />
        <StatCard label="Ingresos (paquetes)" value={`$${stats.revenue}`} hint="USD acumulado" icon="◈" />
        <StatCard
          label="Suscripción"
          value={<Badge tone={sub.status === 'ACTIVE' ? 'success' : 'danger'}>{sub.status}</Badge>}
          hint={`${daysLeft} días restantes`}
          icon="✦"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink">Próximas clases</h2>
            <Link to="/admin/calendar" className="text-sm text-brand font-medium">
              Ver calendario →
            </Link>
          </div>
          <div className="divide-y divide-cream-dark">
            {stats.upcoming.map((s) => {
              const tpl = db.classTemplates.find((t) => t.id === s.templateId)!;
              const coach = db.users.find((u) => u.id === s.coachId);
              const seats = seatsLeft(s.id);
              return (
                <div key={s.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-ink">{tpl.name}</p>
                    <p className="text-sm text-ink-faint">
                      {fmtDay(s.startsAt)} · {fmtTime(s.startsAt)} · {coach?.fullName ?? '—'}
                    </p>
                  </div>
                  <Badge tone={seats <= 3 ? 'warning' : 'success'}>
                    {s.capacity - seats}/{s.capacity} reservados
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-ink mb-4">Accesos rápidos</h2>
          <div className="space-y-2">
            <QuickLink to="/admin/members" label="Miembros (CRM)" icon="⚇" />
            <QuickLink to="/admin/packages" label="Gestionar paquetes" icon="❏" />
            <QuickLink to="/admin/whatsapp" label="WhatsApp IA" icon="✆" />
            <QuickLink to="/admin/rewards" label="Recompensas" icon="★" />
            <QuickLink to="/admin/settings" label="Configuración" icon="⚙" />
          </div>
        </Card>
      </div>
    </>
  );
}

function QuickLink({ to, label, icon }: { to: string; label: string; icon: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-cream-dark px-3 py-2.5 text-sm font-medium text-ink-soft hover:border-brand hover:bg-cream-dark/40 transition"
    >
      <span className="w-5 text-center text-brand">{icon}</span>
      {label}
    </Link>
  );
}
