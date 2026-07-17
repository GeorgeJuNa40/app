import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useStore, isSubscriptionActive } from '../../lib/store';
import { Card, Button } from '../../components/ui';

// Verificación de pago: bloquea el panel del Estudio si la suscripción no está vigente.
// La ruta de Suscripción queda siempre accesible para poder regularizar.
export default function SubscriptionGate({
  children,
  allow = false,
}: {
  children: ReactNode;
  allow?: boolean;
}) {
  const { currentStudio } = useStore();
  const active = isSubscriptionActive(currentStudio);

  if (active || allow) return <>{children}</>;

  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Card className="max-w-md p-8 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-2xl">
          🔒
        </div>
        <h2 className="text-xl font-bold text-ink">Panel bloqueado</h2>
        <p className="mt-2 text-ink-soft">
          Tu suscripción mensual ($34 USD) no está vigente. Regulariza tu pago para recuperar
          el acceso completo a la gestión de tu estudio.
        </p>
        <Link to="/admin/subscription" className="mt-6 inline-block">
          <Button>Ir a Suscripción</Button>
        </Link>
      </Card>
    </div>
  );
}
