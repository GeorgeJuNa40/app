import { useStore } from '../../lib/store';
import { PageHeader, Card, Badge } from '../../components/ui';
import { daysUntil } from '../../lib/format';

// Alumno: historial de metas.
export default function Goals() {
  const { db, currentUser } = useStore();
  const goals = db.goals.filter((g) => g.userId === currentUser!.id);

  return (
    <>
      <PageHeader title="Mis Metas" subtitle="Sigue tu progreso y mantén la constancia" />
      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((g) => {
          const pct = Math.min(100, (g.currentValue / g.targetValue) * 100);
          const done = g.currentValue >= g.targetValue;
          return (
            <Card key={g.id} className="p-5">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-ink">{g.title}</h3>
                <Badge tone={done ? 'success' : 'brand'}>
                  {done ? '¡Lograda!' : `${Math.round(pct)}%`}
                </Badge>
              </div>
              <div className="mt-3 h-2.5 rounded-full bg-cream-dark overflow-hidden">
                <div className="h-full bg-brand transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-sm text-ink-faint">
                <span>{g.currentValue} / {g.targetValue}</span>
                <span>{Math.max(0, daysUntil(g.periodEnd))} días restantes</span>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
