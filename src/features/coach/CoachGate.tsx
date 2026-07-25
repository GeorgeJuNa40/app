import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../lib/store';
import { Card, Button } from '../../components/ui';

// Verificación de estado del coach: un coach PENDIENTE o DENEGADO no accede al
// panel; solo ve un aviso. El coach APROBADO entra normalmente.
export default function CoachGate({ children }: { children: ReactNode }) {
  const { currentUser, logout } = useStore();
  const navigate = useNavigate();
  const status = currentUser?.coachStatus ?? 'APPROVED';

  if (status === 'APPROVED') return <>{children}</>;

  const denied = status === 'DENIED';
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="grid min-h-[70vh] place-items-center p-2">
      <Card className="max-w-md p-8 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-2xl">
          {denied ? '🚫' : '⏳'}
        </div>
        <h2 className="text-xl font-bold text-ink">
          {denied ? 'Acceso no aprobado' : 'Registro en revisión'}
        </h2>
        <p className="mt-2 text-ink-soft">
          {denied
            ? 'Tu acceso como coach fue denegado por el estudio. Si crees que es un error, contacta directamente a tu estudio.'
            : 'Tu registro como coach está pendiente de aprobación. En cuanto el estudio te apruebe, podrás entrar a tu panel.'}
        </p>
        <Button variant="secondary" className="mt-6" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </Card>
    </div>
  );
}
