import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, Button, Card } from '../../components/ui';
import WeekCalendar from '../../components/WeekCalendar';
import { useStore } from '../../lib/store';

// Alumno: reserva de clases con disponibilidad en tiempo real ("Quedan X lugares").
export default function BookClasses() {
  const { db, currentUser, currentStudio, bookSession, cancelBooking } = useStore();
  const uid = currentUser!.id;

  const myActiveBookings = useMemo(
    () =>
      new Map(
        db.bookings
          .filter((b) => b.userId === uid && b.status !== 'CANCELED')
          .map((b) => [b.sessionId, b.id]),
      ),
    [db.bookings, uid],
  );

  const activePkg = db.userPackages.find((p) => p.userId === uid && p.active);
  const creditsLeft = activePkg ? activePkg.creditsTotal - activePkg.creditsUsed : 0;

  return (
    <>
      <PageHeader
        title="Reservar clases"
        subtitle="Elige tu próxima sesión — disponibilidad en tiempo real"
      />

      {!activePkg && (
        <Card className="mb-6 p-4 bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-amber-800">
              No tienes clases disponibles. Compra un paquete para reservar.
            </p>
            <Link to="/app/packages">
              <Button variant="secondary">Ver paquetes</Button>
            </Link>
          </div>
        </Card>
      )}

      <WeekCalendar
        filter={(s) => s.studioId === currentStudio!.id}
        renderAction={(s, seats) => {
          const bookingId = myActiveBookings.get(s.id);
          if (bookingId) {
            return (
              <Button variant="danger" onClick={() => cancelBooking(bookingId)}>
                Cancelar reserva
              </Button>
            );
          }
          const canBook = seats > 0 && creditsLeft > 0;
          return (
            <Button
              disabled={!canBook}
              onClick={() => bookSession(s.id)}
              className="w-full"
            >
              {seats === 0 ? 'Sin lugares' : creditsLeft === 0 ? 'Sin clases' : 'Reservar'}
            </Button>
          );
        }}
      />
    </>
  );
}
