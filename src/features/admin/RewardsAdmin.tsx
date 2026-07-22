import { useState } from 'react';
import { useStore } from '../../lib/store';
import { PageHeader, Card, Button, Badge } from '../../components/ui';
import type { Reward } from '../../lib/types';

const emptyDraft = (studioId: string): Reward => ({
  id: 'new', studioId, name: '', description: '', starCost: 10, active: true,
});

// Plan de recompensas editable — el estudio incentiva a sus alumnos.
export default function RewardsAdmin() {
  const { db, currentStudio, upsertReward, deleteReward } = useStore();
  const rewards = db.rewards.filter((r) => r.studioId === currentStudio!.id);
  const [draft, setDraft] = useState<Reward | null>(null);

  const save = () => {
    if (!draft || !draft.name.trim()) return;
    upsertReward(draft);
    setDraft(null);
  };

  return (
    <>
      <PageHeader
        title="Recompensas"
        subtitle="Gamificación: define premios canjeables con estrellas para incentivar a tus alumnos"
        action={<Button onClick={() => setDraft(emptyDraft(currentStudio!.id))}>+ Nueva recompensa</Button>}
      />

      <Card className="p-4 mb-6 bg-cream-dark/40 text-sm text-ink-soft">
        Los alumnos ganan <strong>1 estrella por asistencia</strong> y las canjean por estas recompensas.
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rewards.map((r) => {
          const redeemed = db.stars.filter((s) => s.reason === 'redemption').length; // demo
          return (
            <Card key={r.id} className="p-5 flex flex-col">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-ink">{r.name}</h3>
                <Badge tone={r.active ? 'brand' : 'neutral'}>★ {r.starCost}</Badge>
              </div>
              <p className="text-sm text-ink-faint mt-1 flex-1">{r.description}</p>
              <p className="text-xs text-ink-faint mt-2">{r.active ? 'Activa' : 'Inactiva'} · {redeemed} canjes totales</p>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setDraft({ ...r })}>Editar</Button>
                <Button variant="ghost" onClick={() => upsertReward({ ...r, active: !r.active })}>{r.active ? 'Ocultar' : 'Activar'}</Button>
                <Button variant="danger" onClick={() => { if (confirm(`¿Eliminar "${r.name}"?`)) deleteReward(r.id); }}>✕</Button>
              </div>
            </Card>
          );
        })}
      </div>

      {draft && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-ink mb-4">{draft.id === 'new' ? 'Nueva recompensa' : 'Editar recompensa'}</h2>
            <div className="space-y-4">
              <Field label="Nombre"><input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
              <Field label="Descripción"><textarea rows={2} className="input" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field>
              <Field label="Costo en estrellas"><input type="number" className="input" value={draft.starCost} onChange={(e) => setDraft({ ...draft, starCost: +e.target.value })} /></Field>
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
