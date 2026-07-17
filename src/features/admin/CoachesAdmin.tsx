import { useStore } from '../../lib/store';
import { PageHeader, Card, Badge } from '../../components/ui';

export default function CoachesAdmin() {
  const { db, currentStudio } = useStore();
  const coaches = db.users.filter(
    (u) => u.studioId === currentStudio!.id && u.role === 'COACH',
  );

  return (
    <>
      <PageHeader title="Coaches" subtitle="Instructores de tu estudio y sus perfiles" />
      <div className="grid gap-4 md:grid-cols-2">
        {coaches.map((c) => {
          const sessions = db.classSessions.filter(
            (s) => s.coachId === c.id && new Date(s.startsAt).getTime() > Date.now(),
          ).length;
          return (
            <Card key={c.id} className="p-5">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-brand text-cream text-lg font-bold">
                  {c.avatarInitials}
                </div>
                <div>
                  <h3 className="font-semibold text-ink">{c.fullName}</h3>
                  <p className="text-sm text-ink-faint">{c.email}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-ink-soft">{c.coachProfile?.bio}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {c.coachProfile?.specialties.map((s) => (
                  <Badge key={s} tone="neutral">{s}</Badge>
                ))}
              </div>
              <div className="mt-4 flex justify-between text-sm text-ink-faint">
                <span>{c.coachProfile?.yearsExp} años de experiencia</span>
                <span>{sessions} clases próximas</span>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
