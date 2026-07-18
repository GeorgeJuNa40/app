import { useStore, isSubscriptionActive } from '../../lib/store';
import { PageHeader, Card, Button, Badge } from '../../components/ui';
import { daysUntil } from '../../lib/format';

// Precio en USD con 2 decimales solo si hace falta.
const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

// Suscripción SaaS con promo de lanzamiento: $1 por 14 días, luego $34.99/mes.
export default function SubscriptionScreen() {
  const { currentStudio, activatePromo, markSubscriptionPaid, setSubscriptionPastDue } = useStore();
  const sub = currentStudio!.subscription;
  const active = isSubscriptionActive(currentStudio);
  const inTrial = sub.status === 'TRIALING' && daysUntil(sub.trialEndsAt) > 0;
  const trialDaysLeft = Math.max(0, daysUntil(sub.trialEndsAt));
  const daysLeft = Math.max(0, daysUntil(sub.currentPeriodEnd));

  return (
    <>
      <PageHeader title="Suscripción" subtitle="Tu plan Move yA para el panel del Estudio" />

      {/* Banner de promoción de lanzamiento */}
      <div
        className="mb-6 rounded-2xl p-5 text-cream shadow-zen"
        style={{ background: 'linear-gradient(135deg, #2D5A4C, #1E3E33)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide opacity-80">Promoción de lanzamiento</p>
            <p className="mt-1 text-xl font-bold">
              Empieza por {money(sub.promoPriceUsd)} · {sub.trialDays} días de prueba
            </p>
            <p className="text-sm opacity-90">
              Después se cobra {money(sub.priceUsd)}/mes. Vigente para registros durante los primeros 3 meses.
            </p>
          </div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            Primeros 3 meses
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-ink-faint">Plan actual</p>
              <p className="text-2xl font-bold text-ink">Move yA · Estudio</p>
            </div>
            <Badge tone={active ? 'success' : 'danger'}>
              {inTrial ? 'En prueba' : active ? 'Activa' : 'Requiere pago'}
            </Badge>
          </div>

          {inTrial ? (
            <>
              <div className="mt-6 flex items-end gap-2">
                <span className="text-4xl font-black text-brand">{money(sub.promoPriceUsd)}</span>
                <span className="text-ink-faint mb-1">pagado · prueba de {sub.trialDays} días</span>
              </div>
              <p className="mt-2 text-sm text-ink-soft">
                Te quedan <strong>{trialDaysLeft} días</strong> de prueba. Al terminar se cobrará{' '}
                <strong>{money(sub.priceUsd)}/mes</strong>.
              </p>
            </>
          ) : (
            <div className="mt-6 flex items-end gap-1">
              <span className="text-4xl font-black text-brand">{money(sub.priceUsd)}</span>
              <span className="text-ink-faint mb-1">USD / mes</span>
            </div>
          )}

          <ul className="mt-4 space-y-2 text-sm text-ink-soft">
            <li>✓ Gestión total de calendario, clases y paquetes</li>
            <li>✓ Coaches y servicios opcionales ilimitados</li>
            <li>✓ White label, CRM, WhatsApp IA y reportes</li>
            <li>✓ Gamificación y recompensas</li>
          </ul>

          <p className="mt-5 text-sm text-ink-faint">
            {inTrial
              ? `Tu prueba termina en ${trialDaysLeft} días.`
              : active
                ? `Próxima renovación en ${daysLeft} días.`
                : 'Tu acceso al panel está bloqueado hasta regularizar el pago.'}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {inTrial ? (
              <Button onClick={markSubscriptionPaid}>Activar plan {money(sub.priceUsd)}/mes</Button>
            ) : active ? (
              <Button onClick={markSubscriptionPaid}>Renovar {money(sub.priceUsd)}</Button>
            ) : (
              <>
                <Button onClick={activatePromo}>Iniciar promo por {money(sub.promoPriceUsd)}</Button>
                <Button variant="secondary" onClick={markSubscriptionPaid}>
                  Pagar {money(sub.priceUsd)}
                </Button>
              </>
            )}
            {active && (
              <Button variant="ghost" onClick={setSubscriptionPastDue}>
                Simular impago (demo)
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-ink mb-3">¿Cómo funciona la promoción?</h2>
          <ol className="space-y-3 text-sm text-ink-soft">
            <li>
              <strong className="text-ink">1. Registro con {money(sub.promoPriceUsd)}.</strong> Quien
              adquiere la app durante los primeros 3 meses del lanzamiento paga solo{' '}
              {money(sub.promoPriceUsd)} y obtiene acceso completo.
            </li>
            <li>
              <strong className="text-ink">2. {sub.trialDays} días de prueba.</strong> Acceso total
              al panel del Estudio sin costo adicional durante la prueba.
            </li>
            <li>
              <strong className="text-ink">3. Cobro de {money(sub.priceUsd)}/mes.</strong> Al cumplir
              los {sub.trialDays} días se realiza el primer cobro mensual y la suscripción continúa.
            </li>
          </ol>
          <p className="mt-4 text-sm text-ink-faint">
            En producción esto se conecta a un proveedor de pagos (Stripe) con periodo de prueba;
            el estado <code>TRIALING → ACTIVE</code> se actualiza vía webhooks al terminar la prueba.
          </p>
        </Card>
      </div>
    </>
  );
}
