import { useStore, isSubscriptionActive } from '../../lib/store';
import { PageHeader, Card, Button, Badge } from '../../components/ui';
import { daysUntil } from '../../lib/format';
import { PLANS, PROMO_PRICE, PROMO_TRIAL_DAYS, getPlan } from '../../lib/plans';
import type { PlanId } from '../../lib/types';

// Precio en USD con 2 decimales (los planes terminan en .99).
const money = (n: number) => `$${n.toFixed(2)}`;

// Suscripción SaaS: 3 planes (Inicio $19.99, Pro $39.99, Premium $79.99) con
// promo de lanzamiento ($1 · 14 días con el plan Pro habilitado). Al terminar
// la prueba, el estudio elige el plan que quiere mantener.
export default function SubscriptionScreen() {
  const { currentStudio, activatePromo, subscribeToPlan, markSubscriptionPaid, setSubscriptionPastDue } =
    useStore();
  const sub = currentStudio!.subscription;

  const trialEndsAt = sub.trialEndsAt ?? sub.currentPeriodEnd;
  const active = isSubscriptionActive(currentStudio);
  const inTrial = sub.status === 'TRIALING' && daysUntil(trialEndsAt) > 0;
  const trialDaysLeft = Math.max(0, daysUntil(trialEndsAt));
  const daysLeft = Math.max(0, daysUntil(sub.currentPeriodEnd));
  const currentPlanId: PlanId = sub.plan ?? 'pro';
  const currentPlan = getPlan(currentPlanId);

  // Estado del encabezado según la situación de la suscripción.
  const statusBadge = inTrial ? 'En prueba' : active ? 'Activa' : 'Requiere pago';
  const statusTone = active ? 'success' : 'danger';

  return (
    <>
      <PageHeader title="Suscripción" subtitle="Elige el plan Move yA ideal para tu estudio" />

      {/* Estado actual de la suscripción */}
      <Card className="mb-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase text-ink-faint">Tu plan</p>
            <p className="text-2xl font-bold text-ink">
              Move yA · {currentPlan.name}
              {inTrial && <span className="text-ink-faint text-base font-normal"> (en prueba)</span>}
            </p>
          </div>
          <Badge tone={statusTone as 'success' | 'danger'}>{statusBadge}</Badge>
        </div>

        {inTrial ? (
          <p className="mt-3 text-sm text-ink-soft">
            Estás en tu prueba de lanzamiento con el <strong>plan Pro habilitado</strong>. Te quedan{' '}
            <strong>{trialDaysLeft} día{trialDaysLeft === 1 ? '' : 's'}</strong>. Cuando termine,
            elige abajo el plan que quieras conservar.
          </p>
        ) : active ? (
          <p className="mt-3 text-sm text-ink-soft">
            Plan <strong>{currentPlan.name}</strong> · {money(currentPlan.priceUsd)}/mes. Próxima
            renovación en <strong>{daysLeft} día{daysLeft === 1 ? '' : 's'}</strong>.
          </p>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">
            Tu acceso al panel está <strong>limitado al inicio</strong> hasta que registres tu pago.
            Aprovecha la oferta de bienvenida o elige un plan.
          </p>
        )}
      </Card>

      {/* Oferta de bienvenida: $1 por 14 días (solo si aún no está activa) */}
      {!active && !inTrial && (
        <div
          className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5 text-cream shadow-zen"
          style={{ background: 'linear-gradient(135deg, #2D5A4C, #1E3E33)' }}
        >
          <div>
            <p className="text-xs uppercase tracking-wide opacity-80">Oferta de bienvenida</p>
            <p className="mt-1 text-xl font-bold">
              Empieza por {money(PROMO_PRICE)} · {PROMO_TRIAL_DAYS} días de prueba
            </p>
            <p className="text-sm opacity-90">
              Activas el plan Pro completo. Al terminar la prueba eliges tu plan.
            </p>
          </div>
          <Button variant="secondary" onClick={activatePromo}>
            Empezar por {money(PROMO_PRICE)}
          </Button>
        </div>
      )}

      {/* Los 3 planes */}
      <div className="grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = active && plan.id === currentPlanId;
          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col p-6 ${
                plan.highlight ? 'ring-2 ring-brand' : ''
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-cream">
                  Más popular
                </span>
              )}

              <h3 className="text-lg font-bold text-ink">{plan.name}</h3>
              <p className="mt-1 text-sm text-ink-faint">{plan.tagline}</p>

              <div className="mt-4 flex items-end gap-1">
                <span className="text-4xl font-black text-brand">{money(plan.priceUsd)}</span>
                <span className="mb-1 text-ink-faint">USD / mes</span>
              </div>

              <ul className="mt-5 flex-1 space-y-2 text-sm text-ink-soft">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-brand">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <Button className="w-full" variant="secondary" disabled>
                    Plan actual
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.highlight ? 'primary' : 'secondary'}
                    onClick={() => subscribeToPlan(plan.id)}
                  >
                    {active ? 'Cambiar a este plan' : `Elegir ${plan.name}`}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Acciones de renovación / demo */}
      {active && (
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={markSubscriptionPaid}>
            Renovar {currentPlan.name} ({money(currentPlan.priceUsd)})
          </Button>
          <Button variant="ghost" onClick={setSubscriptionPastDue}>
            Simular impago (demo)
          </Button>
        </div>
      )}

      {/* Cómo funciona */}
      <Card className="mt-6 p-6">
        <h2 className="mb-3 font-semibold text-ink">¿Cómo funciona?</h2>
        <ol className="space-y-3 text-sm text-ink-soft">
          <li>
            <strong className="text-ink">1. Empieza por {money(PROMO_PRICE)}.</strong> Activas el
            plan Pro completo durante {PROMO_TRIAL_DAYS} días de prueba.
          </li>
          <li>
            <strong className="text-ink">2. Explora sin límites.</strong> Prueba todas las funciones
            del panel del Estudio durante tu periodo de prueba.
          </li>
          <li>
            <strong className="text-ink">3. Elige tu plan.</strong> Al terminar la prueba seleccionas
            Inicio, Pro o Premium. Puedes cambiar de plan o cancelar cuando quieras.
          </li>
        </ol>
        <p className="mt-4 text-sm text-ink-faint">
          En producción esto se conecta a un proveedor de pagos (Stripe) con periodo de prueba; el
          estado <code>TRIALING → ACTIVE</code> se actualiza vía webhooks al terminar la prueba.
        </p>
      </Card>
    </>
  );
}
