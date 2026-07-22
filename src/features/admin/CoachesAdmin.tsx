import { useState } from 'react';
import { useStore } from '../../lib/store';
import { PageHeader, Card, Badge, Button } from '../../components/ui';
import Avatar from '../../components/Avatar';
import ImageUpload from '../../components/ImageUpload';
import type { CoachStatus, User } from '../../lib/types';

const STATUS_META: Record<CoachStatus, { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  APPROVED: { label: 'Aprobado', tone: 'success' },
  PENDING: { label: 'Pendiente', tone: 'warning' },
  DENIED: { label: 'Denegado', tone: 'danger' },
};

const initials = (name: string) =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

type Draft = {
  id: string; fullName: string; email: string; phone: string;
  bio: string; specialties: string; yearsExp: number; avatarUrl?: string;
};

export default function CoachesAdmin() {
  const { currentStudio, studioUsers, setCoachStatus, upsertCoach } = useStore();
  const coaches = studioUsers('COACH');
  const [draft, setDraft] = useState<Draft | null>(null);

  const emptyDraft = (): Draft => ({ id: 'new', fullName: '', email: '', phone: '', bio: '', specialties: '', yearsExp: 1 });

  const editDraft = (c: User) => setDraft({
    id: c.id, fullName: c.fullName, email: c.email, phone: c.phone,
    bio: c.coachProfile?.bio ?? '', specialties: (c.coachProfile?.specialties ?? []).join(', '),
    yearsExp: c.coachProfile?.yearsExp ?? 1, avatarUrl: c.avatarUrl,
  });

  const save = () => {
    if (!draft || !draft.fullName.trim()) return;
    const existing = coaches.find((c) => c.id === draft.id);
    const coach: User = {
      id: draft.id,
      studioId: currentStudio!.id,
      role: 'COACH',
      fullName: draft.fullName,
      email: draft.email,
      phone: draft.phone,
      avatarInitials: initials(draft.fullName),
      avatarUrl: draft.avatarUrl,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      coachStatus: existing?.coachStatus ?? 'APPROVED',
      coachProfile: {
        bio: draft.bio,
        specialties: draft.specialties.split(',').map((s) => s.trim()).filter(Boolean),
        yearsExp: draft.yearsExp,
      },
    };
    upsertCoach(coach);
    setDraft(null);
  };

  return (
    <>
      <PageHeader
        title="Coaches"
        subtitle="Aprueba, deniega o edita a tus instructores"
        action={<Button onClick={() => setDraft(emptyDraft())}>+ Agregar coach</Button>}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {coaches.map((c) => {
          const meta = STATUS_META[c.coachStatus ?? 'APPROVED'];
          return (
            <Card key={c.id} className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar url={c.avatarUrl} initials={c.avatarInitials} className="h-12 w-12 text-base" />
                  <div>
                    <h3 className="font-semibold text-ink">{c.fullName}</h3>
                    <p className="text-xs text-ink-faint">{c.phone} · {c.email}</p>
                  </div>
                </div>
                <Badge tone={meta.tone}>{meta.label}</Badge>
              </div>
              <p className="mt-3 text-sm text-ink-soft">{c.coachProfile?.bio}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {c.coachProfile?.specialties.map((s) => <Badge key={s} tone="neutral">{s}</Badge>)}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => editDraft(c)}>Editar</Button>
                {c.coachStatus !== 'APPROVED' && <Button onClick={() => setCoachStatus(c.id, 'APPROVED')}>Aprobar</Button>}
                {c.coachStatus !== 'DENIED' && <Button variant="danger" onClick={() => setCoachStatus(c.id, 'DENIED')}>Denegar</Button>}
              </div>
            </Card>
          );
        })}
      </div>

      {draft && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4">
          <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-ink mb-4">{draft.id === 'new' ? 'Nuevo coach' : 'Editar coach'}</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar url={draft.avatarUrl} initials={initials(draft.fullName || '?')} className="h-14 w-14 text-lg" />
                <ImageUpload label="Subir foto" onSelect={(url) => setDraft({ ...draft, avatarUrl: url })} />
                {draft.avatarUrl && <button type="button" onClick={() => setDraft({ ...draft, avatarUrl: undefined })} className="text-sm text-red-600">Quitar</button>}
              </div>
              <Field label="Nombre completo"><input className="input" value={draft.fullName} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Teléfono"><input className="input" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></Field>
                <Field label="Años de exp."><input type="number" className="input" value={draft.yearsExp} onChange={(e) => setDraft({ ...draft, yearsExp: +e.target.value })} /></Field>
              </div>
              <Field label="Correo"><input className="input" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></Field>
              <Field label="Especialidades (separadas por coma)"><input className="input" value={draft.specialties} onChange={(e) => setDraft({ ...draft, specialties: e.target.value })} /></Field>
              <Field label="Biografía"><textarea rows={3} className="input" value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} /></Field>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDraft(null)}>Cancelar</Button>
              <Button onClick={save}>Guardar</Button>
            </div>
            <style>{`.input{width:100%;border:1px solid #E8E3D6;border-radius:.75rem;padding:.6rem .8rem;background:#fff;outline:none}.input:focus{box-shadow:0 0 0 2px var(--brand-primary)}`}</style>
          </Card>
        </div>
      )}
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
