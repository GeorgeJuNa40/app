import { useStore } from '../../lib/store';
import { PageHeader, Card, Button, Badge, EmptyState } from '../../components/ui';
import Avatar from '../../components/Avatar';

// Alumno: "Conoce a tus coaches". Muestra a los coaches aprobados del estudio
// con su biografía, especialidades y experiencia, y un contacto por WhatsApp.
export default function StudentCoaches() {
  const { db, currentStudio } = useStore();
  const coaches = db.users.filter(
    (u) => u.role === 'COACH' && u.studioId === currentStudio!.id && u.coachStatus === 'APPROVED',
  );

  const waLink = (num: string | undefined, name: string) => {
    const digits = (num ?? '').replace(/\D/g, '');
    if (!digits) return undefined;
    return `https://wa.me/${digits}?text=${encodeURIComponent(
      `Hola ${name}, me gustaría más información sobre tus clases.`,
    )}`;
  };

  return (
    <>
      <PageHeader title="Conoce a tus coaches" subtitle="El equipo que te acompaña en cada clase" />

      {coaches.length === 0 ? (
        <EmptyState>Tu estudio aún no tiene coaches disponibles.</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {coaches.map((c) => {
            const link = waLink(c.phone, c.fullName);
            const specialties = c.coachProfile?.specialties ?? [];
            const years = c.coachProfile?.yearsExp ?? 0;
            return (
              <Card key={c.id} className="p-6 flex flex-col">
                <div className="flex items-center gap-3">
                  <Avatar url={c.avatarUrl} initials={c.avatarInitials} className="h-14 w-14 text-lg" />
                  <div>
                    <h3 className="font-semibold text-ink">{c.fullName}</h3>
                    {years > 0 && (
                      <p className="text-sm text-ink-faint">
                        {years} {years === 1 ? 'año' : 'años'} de experiencia
                      </p>
                    )}
                  </div>
                </div>

                {specialties.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {specialties.map((sp) => (
                      <Badge key={sp} tone="brand">{sp}</Badge>
                    ))}
                  </div>
                )}

                <p className="mt-3 flex-1 text-sm text-ink-soft">
                  {c.coachProfile?.bio || 'Este coach aún no ha agregado su biografía.'}
                </p>

                {link ? (
                  <a href={link} target="_blank" rel="noreferrer" className="mt-4">
                    <Button variant="secondary" className="w-full">Contactar por WhatsApp</Button>
                  </a>
                ) : (
                  <Button variant="secondary" className="mt-4" disabled>
                    Contacto no disponible
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
