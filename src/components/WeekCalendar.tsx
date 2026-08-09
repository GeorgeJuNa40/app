import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { fmtTime } from '../lib/format';
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

const WD = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
// Clave de día en hora LOCAL (no UTC), para agrupar bien las clases de la noche.
const localKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

// Calendario semanal con barra de días arriba: al abrir muestra las clases de
// HOY y se navega por día. Usado por Admin, Coach y Alumno. Las clases fijas
// (recurring) aparecen en su día de la semana; sus reservas se limpian solas
// cada semana (job en Supabase).
export default function WeekCalendar({ filter, renderAction }: Props) {
  const { db, seatsLeft } = useStore();
  const [sel, setSel] = useState(0); // 0 = hoy

  // Los próximos 7 días a partir de hoy (a medianoche local).
  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [],
  );

  const sessions = useMemo(
    () => db.classSessions.filter((s) => (filter ? filter(s) : true)),
    [db.classSessions, filter],
  );

  // Agrupa las clases por día local y las ordena por hora.
  const byDay = useMemo(() => {
    const m = new Map<string, ClassSession[]>();
    for (const s of sessions) {
      const k = localKey(new Date(s.startsAt));
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(s);
    }
    for (const list of m.values()) list.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    return m;
  }, [sessions]);

  const selList = byDay.get(localKey(days[sel])) ?? [];

  return (
    <div>
      {/* Barra de días de la semana */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {days.map((d, i) => {
          const count = (byDay.get(localKey(d)) ?? []).length;
          const active = i === sel;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSel(i)}
              aria-pressed={active}
              className={`flex min-w-[3.9rem] shrink-0 flex-col items-center rounded-2xl border px-3 py-2 transition ${
                active
                  ? 'border-forest bg-forest text-cream-light shadow-card'
                  : 'border-cream-dark bg-white text-ink-soft hover:border-mint'
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wide">
                {i === 0 ? 'Hoy' : WD[d.getDay()]}
              </span>
              <span className={`text-lg font-black leading-tight ${active ? 'text-cream-light' : 'text-ink'}`}>
                {d.getDate()}
              </span>
              <span
                className={`mt-1 h-1.5 w-1.5 rounded-full ${count ? (active ? 'bg-cream-light' : 'bg-mint') : 'bg-transparent'}`}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>

      {/* Lista del día seleccionado */}
      {selList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cream-dark p-10 text-center text-ink-faint">
          No hay clases este día.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {selList.map((s) => {
            const tpl = db.classTemplates.find((t) => t.id === s.templateId);
            if (!tpl) return null;
            const coach = db.users.find((u) => u.id === s.coachId);
            const seats = seatsLeft(s.id);
            return (
              <div key={s.id} className="overflow-hidden rounded-2xl border border-cream-dark bg-white shadow-sm">
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
      )}
    </div>
  );
}
