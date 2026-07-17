import { useStore } from '../../lib/store';
import { PageHeader, Card, Button, Badge } from '../../components/ui';

// Gamificación: sistema de estrellas por asistencia + canje de recompensas.
export default function Rewards() {
  const { db, currentUser, currentStudio, starBalance, redeemReward } = useStore();
  const uid = currentUser!.id;
  const balance = starBalance(uid);

  const rewards = db.rewards.filter((r) => r.studioId === currentStudio!.id && r.active);
  const history = db.stars
    .filter((s) => s.userId === uid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <PageHeader title="Recompensas" subtitle="Gana estrellas por asistir y canjéalas" />

      {/* Balance destacado */}
      <Card className="p-6 mb-8 bg-forest text-cream">
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
    </>
  );
}
