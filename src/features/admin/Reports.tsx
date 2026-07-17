import { useMemo } from 'react';
import { useStore } from '../../lib/store';
import { PageHeader, Card, StatCard } from '../../components/ui';

export default function Reports() {
  const { db, currentStudio } = useStore();

  const data = useMemo(() => {
    const sid = currentStudio!.id;
    const students = db.users.filter((u) => u.studioId === sid && u.role === 'STUDENT');
    const revenue = db.userPackages.reduce((acc, up) => {
      const pkg = db.packages.find((p) => p.id === up.packageId);
      return acc + (pkg?.priceUsd ?? 0);
    }, 0);
    const attended = db.bookings.filter((b) => b.status === 'ATTENDED').length;
    const totalBookings = db.bookings.filter((b) => b.status !== 'CANCELED').length;

    // Popularidad por tipo de clase.
    const byTemplate = db.classTemplates
      .filter((t) => t.studioId === sid)
      .map((t) => {
        const count = db.bookings.filter((b) => {
          const s = db.classSessions.find((x) => x.id === b.sessionId);
          return s?.templateId === t.id && b.status !== 'CANCELED';
        }).length;
        return { name: t.name, count, color: t.colorHex };
      })
      .sort((a, b) => b.count - a.count);

    const maxCount = Math.max(1, ...byTemplate.map((x) => x.count));
    const starsIssued = db.stars.filter((s) => s.delta > 0).reduce((a, s) => a + s.delta, 0);

    return { students: students.length, revenue, attended, totalBookings, byTemplate, maxCount, starsIssued };
  }, [db, currentStudio]);

  return (
    <>
      <PageHeader title="Reportes" subtitle="Métricas clave de desempeño de tu estudio" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <StatCard label="Ingresos totales" value={`$${data.revenue}`} hint="USD en paquetes" />
        <StatCard label="Reservas totales" value={data.totalBookings} />
        <StatCard label="Asistencias" value={data.attended} />
        <StatCard label="Estrellas emitidas" value={data.starsIssued} icon="★" />
      </div>

      <Card className="p-6">
        <h2 className="font-semibold text-ink mb-4">Popularidad por tipo de clase</h2>
        <div className="space-y-3">
          {data.byTemplate.map((t) => (
            <div key={t.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-ink-soft">{t.name}</span>
                <span className="text-ink-faint">{t.count} reservas</span>
              </div>
              <div className="h-2.5 rounded-full bg-cream-dark overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(t.count / data.maxCount) * 100}%`,
                    background: t.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
