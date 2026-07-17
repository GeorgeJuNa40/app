import { useStore } from '../../lib/store';
import { PageHeader, Card, Badge, Button } from '../../components/ui';
import { usd, daysUntil } from '../../lib/format';

// Alumno: compra de paquetes + vista de paquetes activos y clases restantes.
export default function MyPackages() {
  const { db, currentUser, currentStudio, buyPackage } = useStore();
  const uid = currentUser!.id;

  const myPackages = db.userPackages.filter((p) => p.userId === uid);
  const catalog = db.packages.filter((p) => p.studioId === currentStudio!.id && p.active);

  return (
    <>
      <PageHeader title="Mis Paquetes" subtitle="Tus paquetes activos y el catálogo del estudio" />

      {/* Paquetes activos */}
      <h2 className="mb-3 font-semibold text-ink">Activos</h2>
      {myPackages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cream-dark p-8 text-center text-ink-faint mb-8">
          Aún no has comprado paquetes.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          {myPackages.map((up) => {
            const pkg = db.packages.find((p) => p.id === up.packageId)!;
            const left = up.creditsTotal - up.creditsUsed;
            const pct = (up.creditsUsed / up.creditsTotal) * 100;
            const expired = daysUntil(up.expiresAt) <= 0;
            return (
              <Card key={up.id} className="p-5">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-ink">{pkg.name}</h3>
                  <Badge tone={expired ? 'danger' : left > 0 ? 'success' : 'warning'}>
                    {expired ? 'Vencido' : `${left} clases`}
                  </Badge>
                </div>
                <div className="mt-3 h-2.5 rounded-full bg-cream-dark overflow-hidden">
                  <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 flex justify-between text-sm text-ink-faint">
                  <span>{up.creditsUsed}/{up.creditsTotal} usadas</span>
                  <span>Vence en {Math.max(0, daysUntil(up.expiresAt))} días</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Catálogo */}
      <h2 className="mb-3 font-semibold text-ink">Catálogo del estudio</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {catalog.map((p) => (
          <Card key={p.id} className="p-5 flex flex-col">
            <h3 className="font-semibold text-ink">{p.name}</h3>
            <p className="text-sm text-ink-faint mt-1 flex-1">{p.description}</p>
            <div className="mt-4 flex items-end gap-1">
              <span className="text-2xl font-black text-brand">{usd(p.priceUsd)}</span>
            </div>
            <p className="text-sm text-ink-faint">
              {p.classCredits} clases · vigencia {p.validityDays} días
            </p>
            <div className="mt-3 flex flex-wrap gap-1">
              {p.eligibleClassIds.map((cid) => {
                const t = db.classTemplates.find((x) => x.id === cid);
                return t ? <Badge key={cid} tone="neutral">{t.name}</Badge> : null;
              })}
            </div>
            <Button className="mt-4" onClick={() => buyPackage(p.id)}>
              Comprar
            </Button>
          </Card>
        ))}
      </div>
    </>
  );
}
