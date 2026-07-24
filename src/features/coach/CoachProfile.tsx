import { useState } from 'react';
import { useStore } from '../../lib/store';
import { PageHeader, Card, Button, Badge } from '../../components/ui';
import Avatar from '../../components/Avatar';
import ImageUpload from '../../components/ImageUpload';

// Coach: edita su perfil (nombre, teléfono, bio, especialidades, experiencia
// y foto). Todo se guarda en la nube.
export default function CoachProfile() {
  const { currentUser, updateUserAvatar, updateMyProfile } = useStore();
  const cu = currentUser!;
  const [fullName, setFullName] = useState(cu.fullName);
  const [phone, setPhone] = useState(cu.phone ?? '');
  const [bio, setBio] = useState(cu.coachProfile?.bio ?? '');
  const [specialties, setSpecialties] = useState((cu.coachProfile?.specialties ?? []).join(', '));
  const [yearsExp, setYearsExp] = useState(String(cu.coachProfile?.yearsExp ?? 0));
  const [saved, setSaved] = useState(false);

  const save = () => {
    updateMyProfile({
      fullName: fullName.trim() || cu.fullName,
      phone: phone.trim(),
      bio: bio.trim(),
      specialties: specialties.split(',').map((s) => s.trim()).filter(Boolean),
      yearsExp: Number(yearsExp) || 0,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const specialtyList = specialties.split(',').map((s) => s.trim()).filter(Boolean);

  return (
    <>
      <PageHeader title="Mi Perfil" subtitle="Así te ven tus alumnos" />
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Vista previa */}
        <Card className="p-6 text-center">
          <Avatar url={cu.avatarUrl} initials={cu.avatarInitials} className="mx-auto h-20 w-20 text-2xl" />
          <div className="mt-3 flex justify-center">
            <ImageUpload label="Subir foto" onSelect={(url) => updateUserAvatar(cu.id, url)} />
          </div>
          <h2 className="mt-3 font-semibold text-ink">{fullName}</h2>
          <p className="text-sm text-ink-faint">{cu.email}</p>
          {phone && <p className="text-sm text-ink-faint">{phone}</p>}
          <div className="mt-3 flex flex-wrap justify-center gap-1">
            {specialtyList.map((s) => (
              <Badge key={s} tone="neutral">{s}</Badge>
            ))}
          </div>
          <p className="mt-3 text-sm text-ink-faint">{Number(yearsExp) || 0} años de experiencia</p>
        </Card>

        {/* Edición */}
        <Card className="p-6 lg:col-span-2 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre completo">
              <input className="inp" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </Field>
            <Field label="Teléfono / WhatsApp">
              <input className="inp" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ej. +52 55 1234 5678" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Especialidades (separadas por coma)">
              <input className="inp" value={specialties} onChange={(e) => setSpecialties(e.target.value)} placeholder="Reformer, Mat, Rehabilitación" />
            </Field>
            <Field label="Años de experiencia">
              <input className="inp" type="number" min="0" value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} />
            </Field>
          </div>
          <Field label="Biografía">
            <textarea
              rows={5}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuéntales a tus alumnos sobre ti, tu estilo y tu experiencia."
              className="inp"
            />
          </Field>
          <div className="flex items-center gap-3">
            <Button onClick={save}>Guardar cambios</Button>
            {saved && <span className="text-sm text-green-700">✓ Guardado</span>}
          </div>
        </Card>
      </div>
      <style>{`.inp{width:100%;border:1px solid #E8E3D6;border-radius:.75rem;padding:.6rem .8rem;background:#fff;outline:none}.inp:focus{box-shadow:0 0 0 2px var(--brand-primary)}`}</style>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
