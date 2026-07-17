import { useState } from 'react';
import { useStore } from '../../lib/store';
import { PageHeader, Card, Button, Badge } from '../../components/ui';

// Coach: acceso a su perfil (bio). Edición local en el MVP.
export default function CoachProfile() {
  const { currentUser } = useStore();
  const [bio, setBio] = useState(currentUser!.coachProfile?.bio ?? '');
  const [saved, setSaved] = useState(false);

  return (
    <>
      <PageHeader title="Mi Perfil" subtitle="Así te ven tus alumnos" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand text-cream text-2xl font-bold">
            {currentUser!.avatarInitials}
          </div>
          <h2 className="mt-3 font-semibold text-ink">{currentUser!.fullName}</h2>
          <p className="text-sm text-ink-faint">{currentUser!.email}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-1">
            {currentUser!.coachProfile?.specialties.map((s) => (
              <Badge key={s} tone="neutral">{s}</Badge>
            ))}
          </div>
          <p className="mt-3 text-sm text-ink-faint">
            {currentUser!.coachProfile?.yearsExp} años de experiencia
          </p>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">Biografía</span>
            <textarea
              rows={5}
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                setSaved(false);
              }}
              className="mt-1 w-full rounded-xl border border-cream-dark px-4 py-3 outline-none focus:ring-2 ring-brand"
            />
          </label>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={() => setSaved(true)}>Guardar</Button>
            {saved && <span className="text-sm text-green-700">✓ Guardado</span>}
          </div>
        </Card>
      </div>
    </>
  );
}
