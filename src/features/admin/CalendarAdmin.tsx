import { useState } from 'react';
import { PageHeader, Button, Card } from '../../components/ui';
import WeekCalendar from '../../components/WeekCalendar';
import { useStore } from '../../lib/store';
import type { ClassSession } from '../../lib/types';

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

// Calendario editable: el estudio crea, edita o elimina clases.
export default function CalendarAdmin() {
  const { db, currentStudio, studioUsers, upsertSession, deleteSession } = useStore();
  const studioId = currentStudio!.id;
  const templates = db.classTemplates.filter((t) => t.studioId === studioId);
  const coaches = studioUsers('COACH').filter((c) => c.coachStatus !== 'DENIED');

  const [draft, setDraft] = useState<ClassSession | null>(null);
  const [startLocal, setStartLocal] = useState('');

  const newDraft = () => {
    const start = new Date();
    start.setHours(start.getHours() + 1, 0, 0, 0);
    setDraft({
      id: 'new', studioId,
      templateId: templates[0]?.id ?? '',
      coachId: coaches[0]?.id ?? null,
      startsAt: start.toISOString(), endsAt: start.toISOString(), capacity: 10,
    });
    setStartLocal(toLocalInput(start.toISOString()));
  };

  const editDraft = (s: ClassSession) => {
    setDraft({ ...s });
    setStartLocal(toLocalInput(s.startsAt));
  };

  const save = () => {
    if (!draft || !draft.templateId) return;
    const tpl = templates.find((t) => t.id === draft.templateId)!;
    const start = new Date(startLocal);
    const end = new Date(start.getTime() + tpl.durationMin * 60000);
    upsertSession({ ...draft, startsAt: start.toISOString(), endsAt: end.toISOString() });
    setDraft(null);
  };

  return (
    <>
      <PageHeader
        title="Calendario"
        subtitle="Crea, edita o cancela clases — alumnos y coaches ven los cambios al instante"
        action={<Button onClick={newDraft} disabled={templates.length === 0}>+ Nueva clase</Button>}
      />

      {templates.length === 0 && (
        <Card className="p-4 mb-4 bg-amber-50 border-amber-200 text-sm text-amber-800">
          Primero crea tipos de clase en la sección <strong>Clases</strong>.
        </Card>
      )}

      <WeekCalendar
        filter={(s) => s.studioId === studioId}
        renderAction={(s) => (
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => editDraft(s)}>Editar</Button>
            <Button variant="danger" onClick={() => { if (confirm('¿Cancelar/eliminar esta clase?')) deleteSession(s.id); }}>Eliminar</Button>
          </div>
        )}
      />

      {draft && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4">
          <Card className="w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-ink mb-4">{draft.id === 'new' ? 'Nueva clase' : 'Editar clase'}</h2>
            <div className="space-y-4">
              <Field label="Tipo de clase">
                <select className="input" value={draft.templateId} onChange={(e) => setDraft({ ...draft, templateId: e.target.value })}>
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.durationMin} min)</option>)}
                </select>
              </Field>
              <Field label="Coach">
                <select className="input" value={draft.coachId ?? ''} onChange={(e) => setDraft({ ...draft, coachId: e.target.value || null })}>
                  <option value="">Sin asignar</option>
                  {coaches.map((c) => <option key={c.id} value={c.id}>{c.fullName}{c.coachStatus === 'PENDING' ? ' (pendiente)' : ''}</option>)}
                </select>
              </Field>
              <Field label="Fecha y hora">
                <input type="datetime-local" className="input" value={startLocal} onChange={(e) => setStartLocal(e.target.value)} />
              </Field>
              <Field label="Capacidad (lugares)">
                <input type="number" className="input" value={draft.capacity} onChange={(e) => setDraft({ ...draft, capacity: +e.target.value })} />
              </Field>
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
