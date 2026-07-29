import { useState } from 'react';
import { PageHeader, Card, Badge, Button } from '../../components/ui';
import WeekCalendar from '../../components/WeekCalendar';
import { useStore } from '../../lib/store';
import { fmtTime } from '../../lib/format';
import type { ClassSession } from '../../lib/types';

// Coach: calendario restringido a sus clases + pase de lista (check-in).
export default function CoachCalendar() {
  const { db, currentUser, markAttendance, isNewStudent } = useStore();
  const [rosterId, setRosterId] = useState<string | null>(null);

  // Volvemos a buscar la sesión en el estado para que el pase de lista se
  // actualice en vivo al marcar asistencia.
  const rosterFor: ClassSession | null = rosterId
    ? db.classSessions.find((s) => s.id === rosterId) ?? null
    : null;

  const roster = rosterFor
    ? db.bookings
        .filter((b) => b.sessionId === rosterFor.id && b.status !== 'CANCELED')
        .map((b) => ({ b, u: db.users.find((u) => u.id === b.userId)! }))
        .filter((x) => x.u)
    : [];

  return (
    <>
      <PageHeader title="Mi Calendario" subtitle="Tus clases y el pase de lista de tus alumnos" />
      <WeekCalendar
        filter={(s) => s.coachId === currentUser!.id}
        renderAction={(s) => (
          <Button variant="secondary" onClick={() => setRosterId(s.id)}>
            Pase de lista
          </Button>
        )}
      />

      {rosterFor && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h2 className="font-bold text-ink">
                  {db.classTemplates.find((t) => t.id === rosterFor.templateId)?.name}
                </h2>
                <p className="text-sm text-ink-faint">{fmtTime(rosterFor.startsAt)}</p>
              </div>
              <Badge tone="brand">{roster.length} inscritos</Badge>
            </div>
            <p className="mb-4 text-xs text-ink-faint">
              Marca quién asistió. La asistencia da 1 ★; "No asistió" no devuelve la clase.
            </p>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {roster.length === 0 && (
                <p className="text-sm text-ink-faint">Aún no hay alumnos inscritos.</p>
              )}
              {roster.map(({ b, u }) => (
                <div key={b.id} className="rounded-xl bg-cream-dark/40 p-2.5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-brand text-cream text-xs font-bold">
                      {u.avatarInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{u.fullName}</p>
                      {isNewStudent(u.id) && (
                        <span className="text-xs font-semibold text-brand">✦ Nuevo alumno</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => markAttendance(b.id, true)}
                      className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium border transition ${
                        b.status === 'ATTENDED'
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-ink-soft border-cream-dark'
                      }`}
                    >
                      ✓ Asistió
                    </button>
                    <button
                      onClick={() => markAttendance(b.id, false)}
                      className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium border transition ${
                        b.status === 'NO_SHOW'
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-ink-soft border-cream-dark'
                      }`}
                    >
                      ✗ No asistió
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 text-right">
              <Button variant="ghost" onClick={() => setRosterId(null)}>
                Cerrar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
