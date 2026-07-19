import { useStore, isSubscriptionActive } from '../../lib/store';
import { PageHeader, Card, Button, Badge } from '../../components/ui';
import { daysUntil } from '../../lib/format';

// Precio en USD con 2 decimales solo si hace falta.
const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

// Suscripción SaaS con promo de lanzamiento: $1 por 14 días, luego $34.99/mes.
// Nota interna: la promo está vigente los primeros 3 meses del lanzamiento;
// eso es solo para nosotros y NO se muestra en pantalla al cliente.
export default function SubscriptionScreen() {
  const { currentStudio, activatePromo, markSubscriptionPaid, setSubscriptionPastDue } = useStore();
  const sub = currentStudio!.subscription;

  // Valores por defecto por si faltan campos (datos antiguos).
  const monthlyPrice = sub.priceUsd ?? 34.99;
  const promoPrice = sub.promoPriceUsd ?? 1;
  const trialDays = sub.trialDays ?? 14;
  const trialEndsAt = sub.trialEndsAt ?? sub.currentPeriodEnd;

  const active = isSubscriptionActive(currentStudio);
  const inTrial = sub.status === 'TRIALING' && daysUntil(trialEndsAt) > 0;
  const trialDaysLeft = Math.max(0, daysUntil(trialEndsAt));
  const daysLeft = Math.max(0, daysUntil(sub.currentPeriodEnd));

  return (
    <>
      <PageHeader title="Suscripción" subtitle="Tu plan Move yA para el panel del Estudio" />

      {/* Banner de la oferta que ve el cliente */}
      <div
        className="mb-6 rounded-2xl p-5 text-cream shadow-zen"
        style={{ background: 'linear-gradient(135deg, #2D5A4C, #1E3E33)' }}
      >
        <p className="text-xs uppercase tracking-wide opacity-80">Oferta de bienvenida</p>
        <p className="mt-1 text-xl font-bold">
          Empieza por {money(promoPrice)} · {trialDays} días de prueba
        </p>
        <p className="text-sm opacity-90">
          Después se cobra {money(monthlyPrice)}/mes. Cancela cuando quieras.
        </p>
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
                <span className="text-4xl font-black text-brand">{money(promoPrice)}</span>
                <span className="text-ink-faint mb-1">pagado · prueba de {trialDays} días</span>
              </div>
              <p className="mt-2 text-sm text-ink-soft">
                Te quedan <strong>{trialDaysLeft} días</strong> de prueba. Al terminar se cobrará{' '}
                <strong>{money(monthlyPrice)}/mes</strong>.
              </p>
            </>
          ) : (
            <div className="mt-6 flex items-end gap-1">
              <span className="text-4xl font-black text-brand">{money(monthlyPrice)}</span>
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
              <Button onClick={markSubscriptionPaid}>Activar plan {money(monthlyPrice)}/mes</Button>
            ) : active ? (
              <Button onClick={markSubscriptionPaid}>Renovar {money(monthlyPrice)}</Button>
            ) : (
              <>
                <Button onClick={activatePromo}>Empezar por {money(promoPrice)}</Button>
                <Button variant="secondary" onClick={markSubscriptionPaid}>
                  Pagar {money(monthlyPrice)}
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
          <h2 className="font-semibold text-ink mb-3">¿Cómo funciona?</h2>
          <ol className="space-y-3 text-sm text-ink-soft">
            <li>
              <strong className="text-ink">1. Empieza por {money(promoPrice)}.</strong> Obtienes
              acceso completo al panel del Estudio de inmediato.
            </li>
            <li>
              <strong className="text-ink">2. {trialDays} días de prueba.</strong> Explora todas las
              funciones sin costo adicional durante la prueba.
            </li>
            <li>
              <strong className="text-ink">3. Luego {money(monthlyPrice)}/mes.</strong> Al cumplir
              los {trialDays} días se realiza el primer cobro mensual y la suscripción continúa. Puedes
              cancelar cuando quieras.
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
