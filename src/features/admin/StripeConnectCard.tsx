import { useEffect, useState } from 'react';
import { Card, Button, Badge } from '../../components/ui';
import { useStore } from '../../lib/store';
import {
  getStripeConnectStatus,
  openStripeDashboard,
  startStripeOnboarding,
  type ConnectStatus,
} from '../../lib/payments';

// Tarjeta para que el estudio conecte su propia cuenta de Stripe y reciba los
// pagos de sus alumnos directo en su banco (la app no gestiona ese dinero).
export default function StripeConnectCard() {
  const { currentStudio } = useStore();
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Estado inicial rápido con lo que ya tenemos, y luego confirmamos con Stripe.
    setStatus({
      connected: Boolean(currentStudio?.stripeAccountId),
      chargesEnabled: Boolean(currentStudio?.stripeChargesEnabled),
    });
    getStripeConnectStatus().then(setStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = async () => {
    setBusy(true);
    const ok = await startStripeOnboarding();
    if (!ok) setBusy(false); // si funciona, redirige a Stripe
  };

  const refresh = async () => {
    setBusy(true);
    setStatus(await getStripeConnectStatus());
    setBusy(false);
  };

  const dashboard = async () => {
    setBusy(true);
    await openStripeDashboard();
    setBusy(false);
  };

  const ready = status?.connected && status?.chargesEnabled;
  const pending = status?.connected && !status?.chargesEnabled;

  return (
    <Card className="mb-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-ink-faint">Cobros a tus alumnos</p>
          <h2 className="text-lg font-bold text-ink">Recibe tus pagos en tu cuenta</h2>
        </div>
        {ready ? (
          <Badge tone="success">Activo</Badge>
        ) : pending ? (
          <Badge tone="warning">En revisión</Badge>
        ) : (
          <Badge tone="neutral">Sin conectar</Badge>
        )}
      </div>

      {ready ? (
        <>
          <p className="mt-3 text-sm text-ink-soft">
            ✓ Tu cuenta de Stripe está conectada. Los pagos en línea de tus alumnos llegan{' '}
            <strong>directo a tu cuenta</strong>. Move yA no gestiona ese dinero.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" disabled={busy} onClick={dashboard}>
              Abrir mi panel de Stripe
            </Button>
            <Button variant="ghost" disabled={busy} onClick={refresh}>
              Actualizar estado
            </Button>
          </div>
        </>
      ) : pending ? (
        <>
          <p className="mt-3 text-sm text-ink-soft">
            Ya empezaste el registro, pero Stripe aún necesita <strong>completar algunos datos</strong>{' '}
            (identidad, cuenta bancaria). Continúa para poder recibir pagos.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button disabled={busy} onClick={connect}>
              {busy ? 'Abriendo…' : 'Continuar registro'}
            </Button>
            <Button variant="ghost" disabled={busy} onClick={refresh}>
              Ya lo completé — actualizar
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm text-ink-soft">
            Conecta tu propia cuenta de Stripe para cobrar en línea. El dinero de tus alumnos llega{' '}
            <strong>directo a tu banco</strong>; tú pones tus datos y Stripe hace los depósitos. Move yA
            no cobra comisión por eso.
          </p>
          <div className="mt-4">
            <Button disabled={busy} onClick={connect}>
              {busy ? 'Abriendo…' : 'Conectar cuenta de pagos'}
            </Button>
          </div>
        </>
      )}

      <p className="mt-4 text-xs text-ink-faint">
        🔒 El registro y tus datos bancarios los maneja Stripe de forma segura. Sin esto, tus alumnos
        no podrán pagar sus paquetes con tarjeta en línea.
      </p>
    </Card>
  );
}
