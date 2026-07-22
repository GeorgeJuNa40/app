import { useMemo } from 'react';
import { useStore } from '../lib/store';
import { fmtFullDay, fmtTime, dayKey } from '../lib/format';
import { Badge } from './ui';
import ClassThumb from './ClassThumb';
import Avatar from './Avatar';
import type { ClassSession } from '../lib/types';

interface Props {
  // Filtra las sesiones a mostrar (ej. solo las del coach actual).
  filter?: (s: ClassSession) => boolean;
  // Render de la acción por sesión (ej. botón "Reservar" para alumnos).
  renderAction?: (s: ClassSession, seatsLeft: number) => React.ReactNode;
}

// Calendario semanal agrupado por día — usado por Admin, Coach y Alumno.
export default function WeekCalendar({ filter, renderAction }: Props) {
  const { db, seatsLeft } = useStore();

  const grouped = useMemo(() => {
    const sessions = db.classSessions
      .filter((s) => (filter ? filter(s) : true))
      .filter((s) => new Date(s.startsAt).getTime() > Date.now() - 3600_000)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

    const map = new Map<string, ClassSession[]>();
    for (const s of sessions) {
      const key = dayKey(s.startsAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries());
  }, [db.classSessions, filter]);

  if (grouped.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-cream-dark p-10 text-center text-ink-faint">
        No hay clases programadas.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map(([key, sessions]) => (
        <div key={key}>
          <h3 className="mb-3 text-sm font-semibold capitalize text-ink-soft">
            {fmtFullDay(sessions[0].startsAt)}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sessions.map((s) => {
              const tpl = db.classTemplates.find((t) => t.id === s.templateId)!;
              const coach = db.users.find((u) => u.id === s.coachId);
              const seats = seatsLeft(s.id);
              return (
                <div
                  key={s.id}
                  className="overflow-hidden rounded-2xl bg-white border border-cream-dark shadow-sm"
                >
                  {/* Foto del tipo de clase */}
                  <div className="relative">
                    <ClassThumb tpl={tpl} rounded="rounded-none" className="h-24 w-full text-2xl" />
                    <div className="absolute right-2 top-2">
                      {seats <= 3 ? (
                        <Badge tone={seats === 0 ? 'danger' : 'warning'}>
                          {seats === 0 ? 'Lleno' : `Quedan ${seats}`}
                        </Badge>
                      ) : (
                        <Badge tone="success">{seats} lugares</Badge>
                      )}
                    </div>
                  </div>
                  <div className="p-4" style={{ borderLeft: `4px solid ${tpl.colorHex}` }}>
                    <p className="font-semibold text-ink">{tpl.name}</p>
                    <p className="text-sm text-ink-faint">
                      {fmtTime(s.startsAt)} · {tpl.durationMin} min
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      {coach ? (
                        <>
                          <Avatar url={coach.avatarUrl} initials={coach.avatarInitials} className="h-6 w-6 text-[10px]" />
                          <span className="text-sm text-ink-soft">con {coach.fullName}</span>
                        </>
                      ) : (
                        <span className="text-sm text-ink-soft">Sin coach asignado</span>
                      )}
                    </div>
                    {renderAction && <div className="mt-3">{renderAction(s, seats)}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
