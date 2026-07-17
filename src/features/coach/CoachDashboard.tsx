import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../lib/store';
import { PageHeader, StatCard, Card, Badge } from '../../components/ui';
import { fmtDay, fmtTime } from '../../lib/format';

export default function CoachDashboard() {
  const { db, currentUser, seatsLeft } = useStore();

  const upcoming = useMemo(
    () =>
      db.classSessions
        .filter((s) => s.coachId === currentUser!.id)
        .filter((s) => new Date(s.startsAt).getTime() > Date.now())
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [db.classSessions, currentUser],
  );

  const totalStudents = upcoming.reduce(
    (acc, s) => acc + (s.capacity - seatsLeft(s.id)),
    0,
  );

  return (
    <>
      <PageHeader
        title={`Hola, ${currentUser!.fullName.split(' ')[0]}`}
        subtitle="Tu agenda de clases y alumnos inscritos"
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <StatCard label="Clases próximas" value={upcoming.length} icon="▦" />
        <StatCard label="Alumnos inscritos" value={totalStudents} icon="⚇" />
        <StatCard
          label="Especialidades"
          value={currentUser!.coachProfile?.specialties.length ?? 0}
          icon="✦"
        />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink">Tus próximas clases</h2>
          <Link to="/coach/calendar" className="text-sm text-brand font-medium">
            Ver calendario →
          </Link>
        </div>
        <div className="divide-y divide-cream-dark">
          {upcoming.slice(0, 6).map((s) => {
            const tpl = db.classTemplates.find((t) => t.id === s.templateId)!;
            const enrolled = s.capacity - seatsLeft(s.id);
            return (
              <div key={s.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-ink">{tpl.name}</p>
                  <p className="text-sm text-ink-faint">
                    {fmtDay(s.startsAt)} · {fmtTime(s.startsAt)}
                  </p>
                </div>
                <Badge tone={enrolled >= s.capacity ? 'danger' : 'success'}>
                  {enrolled}/{s.capacity} alumnos
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}
