import { useState } from 'react';
import { useStore } from '../../lib/store';
import { PageHeader, Card, Badge, Button } from '../../components/ui';
import { usd, daysUntil } from '../../lib/format';
import type { Package, PaymentMethod } from '../../lib/types';

// Alumno: compra de paquetes (con pasarela de pago) + paquetes activos.
export default function MyPackages() {
  const { db, currentUser, currentStudio, buyPackageOnline } = useStore();
  const uid = currentUser!.id;
  const myPackages = db.userPackages.filter((p) => p.userId === uid);
  const catalog = db.packages.filter((p) => p.studioId === currentStudio!.id && p.active);
  const [checkout, setCheckout] = useState<Package | null>(null);

  return (
    <>
      <PageHeader title="Mis Paquetes" subtitle="Tus paquetes activos y el catálogo del estudio" />

      <h2 className="mb-3 font-semibold text-ink">Activos</h2>
      {myPackages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cream-dark p-8 text-center text-ink-faint mb-8">Aún no has comprado paquetes.</div>
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
                  <Badge tone={expired ? 'danger' : left > 0 ? 'success' : 'warning'}>{expired ? 'Vencido' : `${left} clases`}</Badge>
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

      <h2 className="mb-3 font-semibold text-ink">Catálogo del estudio</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {catalog.map((p) => (
          <Card key={p.id} className="p-5 flex flex-col">
            <h3 className="font-semibold text-ink">{p.name}</h3>
            <p className="text-sm text-ink-faint mt-1 flex-1">{p.description}</p>
            <div className="mt-4 flex items-end gap-1"><span className="text-2xl font-black text-brand">{usd(p.priceUsd)}</span></div>
            <p className="text-sm text-ink-faint">{p.classCredits} clases · vigencia {p.validityDays} días</p>
            <Button className="mt-4" onClick={() => setCheckout(p)}>Comprar</Button>
          </Card>
        ))}
      </div>

      {checkout && (
        <CheckoutModal
          pkg={checkout}
          onClose={() => setCheckout(null)}
          onPaid={(method) => { buyPackageOnline(checkout.id, method); setCheckout(null); }}
        />
      )}
    </>
  );
}

// Pasarela de pago (simulada): tarjeta de crédito/débito o PayPal.
function CheckoutModal({ pkg, onClose, onPaid }: { pkg: Package; onClose: () => void; onPaid: (m: PaymentMethod) => void }) {
  const [tab, setTab] = useState<'card' | 'paypal'>('card');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const pay = (method: PaymentMethod) => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setDone(true);
      setTimeout(() => onPaid(method), 900);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <Card className="w-full max-w-md p-6" >
        <div onClick={(e) => e.stopPropagation()}>
          {done ? (
            <div className="text-center py-8">
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-green-100 text-2xl">✓</div>
              <h2 className="text-lg font-bold text-ink">¡Pago aprobado!</h2>
              <p className="text-ink-faint mt-1">Tu plan {pkg.name} está activo.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-bold text-ink">Pagar {pkg.name}</h2>
                <span className="text-xl font-black text-brand">{usd(pkg.priceUsd)}</span>
              </div>
              <p className="text-sm text-ink-faint mb-4">Pago seguro · procesado con Stripe/PayPal</p>

              <div className="flex gap-2 mb-4">
                <button onClick={() => setTab('card')} className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold border ${tab === 'card' ? 'bg-brand text-cream border-brand' : 'bg-white text-ink-soft border-cream-dark'}`}>Tarjeta</button>
                <button onClick={() => setTab('paypal')} className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold border ${tab === 'paypal' ? 'bg-brand text-cream border-brand' : 'bg-white text-ink-soft border-cream-dark'}`}>PayPal</button>
              </div>

              {tab === 'card' ? (
                <div className="space-y-3">
                  <input className="input" placeholder="Nombre en la tarjeta" />
                  <input className="input" placeholder="Número de tarjeta" inputMode="numeric" />
                  <div className="grid grid-cols-2 gap-3">
                    <input className="input" placeholder="MM/AA" />
                    <input className="input" placeholder="CVC" inputMode="numeric" />
                  </div>
                  <Button className="w-full" disabled={processing} onClick={() => pay('card')}>
                    {processing ? 'Procesando…' : `Pagar ${usd(pkg.priceUsd)}`}
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-ink-soft mb-4">Serás redirigido a PayPal para completar el pago de forma segura.</p>
                  <Button className="w-full" disabled={processing} onClick={() => pay('paypal')}>
                    {processing ? 'Procesando…' : 'Pagar con PayPal'}
                  </Button>
                </div>
              )}
              <button onClick={onClose} className="mt-3 w-full text-sm text-ink-faint">Cancelar</button>
            </>
          )}
        </div>
        <style>{`.input{width:100%;border:1px solid #E8E3D6;border-radius:.75rem;padding:.6rem .8rem;background:#fff;outline:none}.input:focus{box-shadow:0 0 0 2px var(--brand-primary)}`}</style>
      </Card>
    </div>
  );
}
