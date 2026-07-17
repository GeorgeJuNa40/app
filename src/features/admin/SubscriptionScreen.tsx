import { useStore, isSubscriptionActive } from '../../lib/store';
import { PageHeader, Card, Button, Badge } from '../../components/ui';
import { daysUntil } from '../../lib/format';

// Gestión de la suscripción SaaS ($34 USD/mes).
export default function SubscriptionScreen() {
  const { currentStudio, markSubscriptionPaid, setSubscriptionPastDue } = useStore();
  const sub = currentStudio!.subscription;
  const active = isSubscriptionActive(currentStudio);
  const daysLeft = daysUntil(sub.currentPeriodEnd);

  return (
    <>
      <PageHeader title="Suscripción" subtitle="Tu plan Move yA para el panel del Estudio" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-ink-faint">Plan actual</p>
              <p className="text-2xl font-bold text-ink">Move yA · Estudio</p>
            </div>
            <Badge tone={active ? 'success' : 'danger'}>
              {active ? 'Activa' : 'Requiere pago'}
            </Badge>
          </div>

          <div className="mt-6 flex items-end gap-1">
            <span className="text-4xl font-black text-brand">${sub.priceUsd}</span>
            <span className="text-ink-faint mb-1">USD / mes</span>
          </div>

          <ul className="mt-4 space-y-2 text-sm text-ink-soft">
            <li>✓ Gestión total de calendario, clases y paquetes</li>
            <li>✓ Coaches y servicios opcionales ilimitados</li>
            <li>✓ White label y reportes</li>
            <li>✓ Gamificación y recompensas</li>
          </ul>

          <p className="mt-5 text-sm text-ink-faint">
            {active
              ? `Próxima renovación en ${daysLeft} días.`
              : 'Tu acceso al panel está bloqueado hasta regularizar el pago.'}
          </p>

          <div className="mt-6 flex gap-2">
            <Button onClick={markSubscriptionPaid}>
              {active ? 'Renovar ahora' : 'Pagar $34 USD'}
            </Button>
            {active && (
              <Button variant="ghost" onClick={setSubscriptionPastDue}>
                Simular impago (demo)
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-ink mb-3">¿Cómo funciona la verificación?</h2>
          <p className="text-sm text-ink-soft leading-relaxed">
            En cada acceso al panel del Estudio, Move yA verifica que la suscripción esté
            <strong> ACTIVA</strong> y que la fecha de <em>currentPeriodEnd</em> no haya
            expirado. Si el pago mensual vence, el estado cambia a <strong>PAST_DUE</strong> y
            el panel se bloquea (los alumnos y coaches conservan acceso de solo lectura hasta
            regularizar).
          </p>
          <p className="mt-3 text-sm text-ink-soft">
            En producción esta lógica se conecta a un proveedor de pagos (Stripe) mediante
            webhooks que actualizan <code>Subscription.status</code>.
          </p>
        </Card>
      </div>
    </>
  );
}
