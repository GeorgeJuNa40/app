import { useState } from 'react';
import { useStore } from '../../lib/store';
import { PageHeader, Card, Badge, Button } from '../../components/ui';
import { usd } from '../../lib/format';
import type { Package } from '../../lib/types';

const emptyDraft = (studioId: string): Package => ({
  id: 'new',
  studioId,
  name: '',
  description: '',
  priceUsd: 0,
  classCredits: 1,
  validityDays: 30,
  active: true,
  eligibleClassIds: [],
});

// Pantalla clave: Gestión de Paquetes.
// El estudio define precios, vigencia y clases participantes.
export default function PackageManagement() {
  const { db, currentStudio, upsertPackage, togglePackageActive } = useStore();
  const studioId = currentStudio!.id;
  const packages = db.packages.filter((p) => p.studioId === studioId);
  const templates = db.classTemplates.filter((t) => t.studioId === studioId);

  const [draft, setDraft] = useState<Package | null>(null);

  const startNew = () => setDraft(emptyDraft(studioId));
  const startEdit = (p: Package) => setDraft({ ...p });

  const save = () => {
    if (!draft || !draft.name.trim()) return;
    upsertPackage(draft);
    setDraft(null);
  };

  const toggleClass = (id: string) => {
    if (!draft) return;
    const has = draft.eligibleClassIds.includes(id);
    setDraft({
      ...draft,
      eligibleClassIds: has
        ? draft.eligibleClassIds.filter((c) => c !== id)
        : [...draft.eligibleClassIds, id],
    });
  };

  return (
    <>
      <PageHeader
        title="Gestión de Paquetes"
        subtitle="Define precios, vigencia y clases participantes"
        action={<Button onClick={startNew}>+ Nuevo paquete</Button>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {packages.map((p) => {
          const usedCount = db.userPackages.filter((up) => up.packageId === p.id).length;
          return (
            <Card key={p.id} className="p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-ink">{p.name}</h3>
                  <p className="text-sm text-ink-faint mt-0.5">{p.description}</p>
                </div>
                <Badge tone={p.active ? 'success' : 'neutral'}>
                  {p.active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Metric label="Precio" value={usd(p.priceUsd)} />
                <Metric label="Clases" value={`${p.classCredits}`} />
                <Metric label="Vigencia" value={`${p.validityDays}d`} />
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {p.eligibleClassIds.map((cid) => {
                  const t = templates.find((x) => x.id === cid);
                  return t ? <Badge key={cid} tone="brand">{t.name}</Badge> : null;
                })}
              </div>

              <p className="mt-3 text-xs text-ink-faint">{usedCount} alumno(s) lo han comprado</p>

              <div className="mt-4 flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => startEdit(p)}>
                  Editar
                </Button>
                <Button variant="ghost" onClick={() => togglePackageActive(p.id)}>
                  {p.active ? 'Desactivar' : 'Activar'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Editor modal */}
      {draft && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4">
          <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-ink mb-4">
              {draft.id === 'new' ? 'Nuevo paquete' : 'Editar paquete'}
            </h2>
            <div className="space-y-4">
              <Field label="Nombre">
                <input
                  className="input"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </Field>
              <Field label="Descripción">
                <textarea
                  className="input"
                  rows={2}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Precio (USD)">
                  <input
                    type="number"
                    className="input"
                    value={draft.priceUsd}
                    onChange={(e) => setDraft({ ...draft, priceUsd: +e.target.value })}
                  />
                </Field>
                <Field label="Clases">
                  <input
                    type="number"
                    className="input"
                    value={draft.classCredits}
                    onChange={(e) => setDraft({ ...draft, classCredits: +e.target.value })}
                  />
                </Field>
                <Field label="Vigencia (días)">
                  <input
                    type="number"
                    className="input"
                    value={draft.validityDays}
                    onChange={(e) => setDraft({ ...draft, validityDays: +e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Clases participantes">
                <div className="flex flex-wrap gap-2">
                  {templates.map((t) => {
                    const on = draft.eligibleClassIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        onClick={() => toggleClass(t.id)}
                        className={`rounded-full px-3 py-1.5 text-sm border transition ${
                          on
                            ? 'bg-brand text-cream border-brand'
                            : 'bg-white text-ink-soft border-cream-dark'
                        }`}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDraft(null)}>
                Cancelar
              </Button>
              <Button onClick={save}>Guardar</Button>
            </div>
          </Card>
        </div>
      )}

      <style>{`
        .input { width:100%; border:1px solid #E8E3D6; border-radius:0.75rem; padding:0.6rem 0.8rem; outline:none; background:#fff; }
        .input:focus { box-shadow:0 0 0 2px var(--brand-primary); }
      `}</style>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-cream-dark/40 py-2">
      <p className="text-xs text-ink-faint">{label}</p>
      <p className="font-semibold text-ink text-sm">{value}</p>
    </div>
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
