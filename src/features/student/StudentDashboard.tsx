import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../lib/store';
import { PageHeader, StatCard, Card, Badge, Button } from '../../components/ui';
import { fmtDay, fmtTime, daysUntil } from '../../lib/format';

export default function StudentDashboard() {
  const { db, currentUser, starBalance } = useStore();
  const uid = currentUser!.id;

  const data = useMemo(() => {
    const myBookings = db.bookings
      .filter((b) => b.userId === uid && b.status !== 'CANCELED')
      .map((b) => ({ booking: b, session: db.classSessions.find((s) => s.id === b.sessionId)! }))
      .filter((x) => x.session && new Date(x.session.startsAt).getTime() > Date.now())
      .sort((a, b) => a.session.startsAt.localeCompare(b.session.startsAt));

    const activePkg = db.userPackages.find((p) => p.userId === uid && p.active);
    const creditsLeft = activePkg ? activePkg.creditsTotal - activePkg.creditsUsed : 0;
    return { myBookings, activePkg, creditsLeft };
  }, [db, uid]);

  const stars = starBalance(uid);

  return (
    <>
      <PageHeader
        title={`Hola, ${currentUser!.fullName.split(' ')[0]} ✦`}
        subtitle="Tu bienestar, en un solo lugar"
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <StatCard
          label="Estrellas"
          value={stars}
          hint="Canjéalas por recompensas"
          icon="★"
        />
        <StatCard
          label="Clases restantes"
          value={data.creditsLeft}
          hint={data.activePkg ? 'En tu paquete activo' : 'Sin paquete activo'}
          icon="❏"
        />
        <StatCard label="Próximas reservas" value={data.myBookings.length} icon="▦" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink">Tus próximas clases</h2>
            <Link to="/app/book" className="text-sm text-brand font-medium">
              Reservar más →
            </Link>
          </div>
          {data.myBookings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-cream-dark p-8 text-center text-ink-faint">
              No tienes clases reservadas.{' '}
              <Link to="/app/book" className="text-brand font-medium">Reserva ahora</Link>
            </div>
          ) : (
            <div className="divide-y divide-cream-dark">
              {data.myBookings.map(({ booking, session }) => {
                const tpl = db.classTemplates.find((t) => t.id === session.templateId)!;
                const coach = db.users.find((u) => u.id === session.coachId);
                return (
                  <div key={booking.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-ink">{tpl.name}</p>
                      <p className="text-sm text-ink-faint">
                        {fmtDay(session.startsAt)} · {fmtTime(session.startsAt)} · {coach?.fullName}
                      </p>
                    </div>
                    <Badge tone="success">Reservada</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-ink mb-3">Paquete activo</h2>
          {data.activePkg ? (
            <>
              {(() => {
                const pkg = db.packages.find((p) => p.id === data.activePkg!.packageId)!;
                const pct = (data.activePkg!.creditsUsed / data.activePkg!.creditsTotal) * 100;
                return (
                  <>
                    <p className="font-medium text-brand">{pkg.name}</p>
                    <div className="mt-3 h-2.5 rounded-full bg-cream-dark overflow-hidden">
                      <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-2 text-sm text-ink-soft">
                      {data.creditsLeft} de {data.activePkg!.creditsTotal} clases disponibles
                    </p>
                    <p className="text-xs text-ink-faint">
                      Vence en {daysUntil(data.activePkg!.expiresAt)} días
                    </p>
                  </>
                );
              })()}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-ink-faint mb-3">No tienes un paquete activo.</p>
              <Link to="/app/packages">
                <Button>Comprar paquete</Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
