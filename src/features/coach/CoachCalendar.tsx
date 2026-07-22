import { useState } from 'react';
import { PageHeader, Card, Badge, Button } from '../../components/ui';
import WeekCalendar from '../../components/WeekCalendar';
import { useStore } from '../../lib/store';
import { fmtTime } from '../../lib/format';
import type { ClassSession } from '../../lib/types';

// Coach: calendario restringido a sus clases + visualización de alumnos inscritos.
export default function CoachCalendar() {
  const { db, currentUser } = useStore();
  const [rosterFor, setRosterFor] = useState<ClassSession | null>(null);

  const roster = rosterFor
    ? db.bookings
        .filter((b) => b.sessionId === rosterFor.id && b.status !== 'CANCELED')
        .map((b) => db.users.find((u) => u.id === b.userId)!)
        .filter(Boolean)
    : [];

  return (
    <>
      <PageHeader title="Mi Calendario" subtitle="Solo tus clases asignadas" />
      <WeekCalendar
        filter={(s) => s.coachId === currentUser!.id}
        renderAction={(s) => (
          <Button variant="secondary" onClick={() => setRosterFor(s)}>
            Ver alumnos
          </Button>
        )}
      />

      {rosterFor && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-bold text-ink">
                  {db.classTemplates.find((t) => t.id === rosterFor.templateId)?.name}
                </h2>
                <p className="text-sm text-ink-faint">{fmtTime(rosterFor.startsAt)}</p>
              </div>
              <Badge tone="brand">{roster.length} inscritos</Badge>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {roster.length === 0 && (
                <p className="text-sm text-ink-faint">Aún no hay alumnos inscritos.</p>
              )}
              {roster.map((u) => (
                <div key={u.id} className="flex items-center gap-3 rounded-xl bg-cream-dark/40 p-2.5">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-brand text-cream text-xs font-bold">
                    {u.avatarInitials}
                  </div>
                  <span className="text-sm font-medium text-ink">{u.fullName}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 text-right">
              <Button variant="ghost" onClick={() => setRosterFor(null)}>
                Cerrar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
