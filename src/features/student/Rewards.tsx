import { useEffect, useState } from 'react';
import { useStore } from '../../lib/store';
import { PageHeader, Card, Button, Badge } from '../../components/ui';
import { daysUntil } from '../../lib/format';

// Gamificación: estrellas por asistencia, canje de recompensas y metas.
export default function Rewards() {
  const { db, currentUser, currentStudio, starBalance, redeemReward, createGoal, deleteGoal, goalProgress, awardGoal } = useStore();
  const uid = currentUser!.id;
  const balance = starBalance(uid);
  const goalReward = currentStudio!.branding.goalStarReward ?? 5;

  const rewards = db.rewards.filter((r) => r.studioId === currentStudio!.id && r.active);
  const goals = db.goals.filter((g) => g.userId === uid);
  const history = db.stars
    .filter((s) => s.userId === uid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Formulario de nueva meta (la crea el propio alumno).
  const [showForm, setShowForm] = useState(false);
  const [gTitle, setGTitle] = useState('');
  const [gTarget, setGTarget] = useState('');
  const [gDate, setGDate] = useState('');
  const submitGoal = () => {
    const t = Number(gTarget);
    if (!gTitle.trim() || !t || t < 1 || !gDate) return;
    createGoal(gTitle, t, new Date(gDate + 'T23:59:59').toISOString());
    setGTitle('');
    setGTarget('');
    setGDate('');
    setShowForm(false);
  };

  // Autocalifica: cuando el alumno ya cumplió una meta (por asistencia), la app
  // la valida en el servidor y le da sus estrellas automáticamente.
  useEffect(() => {
    goals.forEach((g) => {
      if (!g.achieved && goalProgress(g) >= g.targetValue) awardGoal(g.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db.bookings, db.goals]);

  return (
    <>
      <PageHeader title="Recompensas" subtitle="Gana estrellas por asistir y canjéalas" />

      {/* Balance destacado */}
      <Card className="p-6 mb-8 bg-brand text-cream">
        <p className="text-sm opacity-80">Tu saldo de estrellas</p>
        <p className="mt-1 text-5xl font-black">★ {balance}</p>
        <p className="mt-2 text-sm opacity-80">
          Ganas 1 estrella por cada clase a la que asistes.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 font-semibold text-ink">Canjea tus estrellas</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {rewards.map((r) => {
              const affordable = balance >= r.starCost;
              return (
                <Card key={r.id} className="p-5 flex flex-col">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-ink">{r.name}</h3>
                    <Badge tone="brand">★ {r.starCost}</Badge>
                  </div>
                  <p className="text-sm text-ink-faint mt-1 flex-1">{r.description}</p>
                  <Button
                    className="mt-4"
                    disabled={!affordable}
                    onClick={() => redeemReward(r.id)}
                  >
                    {affordable ? 'Canjear' : `Faltan ${r.starCost - balance} ★`}
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="mb-3 font-semibold text-ink">Historial</h2>
          <Card className="p-4">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl bg-cream-dark/40 px-3 py-2 text-sm"
                >
                  <span className="text-ink-soft capitalize">
                    {s.reason === 'attendance'
                      ? 'Asistencia'
                      : s.reason === 'redemption'
                        ? 'Canje'
                        : 'Bonus'}
                  </span>
                  <span
                    className={`font-semibold ${s.delta > 0 ? 'text-green-700' : 'text-red-600'}`}
                  >
                    {s.delta > 0 ? '+' : ''}
                    {s.delta} ★
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Mis Metas — las define el propio alumno; la app cuenta sus asistencias */}
      <div className="mt-10 mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-ink">Mis Metas</h2>
        <Button variant="secondary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancelar' : '+ Nueva meta'}
        </Button>
      </div>

      {showForm && (
        <Card className="p-5 mb-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block sm:col-span-3">
              <span className="mb-1 block text-sm font-medium text-ink-soft">¿Qué quieres lograr?</span>
              <input className="ginp" placeholder="Ej. Ir 12 veces este mes" value={gTitle} onChange={(e) => setGTitle(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-soft">Clases a asistir</span>
              <input className="ginp" type="number" min="1" placeholder="12" value={gTarget} onChange={(e) => setGTarget(e.target.value)} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-ink-soft">Fecha límite</span>
              <input className="ginp" type="date" value={gDate} onChange={(e) => setGDate(e.target.value)} />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button onClick={submitGoal}>Crear meta</Button>
            {goalReward > 0 && (
              <span className="text-sm text-ink-faint">Ganas <strong className="text-brand">{goalReward} ★</strong> al cumplirla.</span>
            )}
          </div>
          <style>{`.ginp{width:100%;border:1px solid #E8E3D6;border-radius:.75rem;padding:.55rem .8rem;background:#fff;outline:none}.ginp:focus{box-shadow:0 0 0 2px var(--brand-primary)}`}</style>
        </Card>
      )}

      {goals.length === 0 && !showForm ? (
        <div className="rounded-2xl border border-dashed border-cream-dark p-6 text-center text-ink-faint">
          Aún no tienes metas. Ponte una y la app irá contando tus asistencias. 💪
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((g) => {
            const prog = goalProgress(g);
            const done = g.achieved || prog >= g.targetValue;
            const pct = Math.min(100, (prog / Math.max(1, g.targetValue)) * 100);
            return (
              <Card key={g.id} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-ink">{g.title}</h3>
                  <div className="flex items-center gap-2">
                    <Badge tone={done ? 'success' : 'brand'}>{done ? '¡Lograda!' : `${Math.round(pct)}%`}</Badge>
                    <button onClick={() => deleteGoal(g.id)} className="text-red-600 text-sm" aria-label="Eliminar meta">✕</button>
                  </div>
                </div>
                <div className="mt-3 h-2.5 rounded-full bg-cream-dark overflow-hidden">
                  <div className="h-full bg-brand transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 flex justify-between text-sm text-ink-faint">
                  <span>{prog} / {g.targetValue} clases</span>
                  <span>{done ? `¡+${goalReward} ★!` : `${Math.max(0, daysUntil(g.periodEnd))} días restantes`}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
