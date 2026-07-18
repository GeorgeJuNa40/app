import { useStore } from '../../lib/store';
import { PageHeader, Card } from '../../components/ui';
import ImageUpload from '../../components/ImageUpload';

// Configuración: datos del negocio, fotos y White-label (branding).
export default function Settings() {
  const { currentStudio, updateStudio, updateBranding } = useStore();
  const s = currentStudio!;
  const b = s.branding;
  const fonts = ['Inter', 'Georgia', 'Poppins', 'system-ui'];

  const addPhoto = (dataUrl: string) => updateStudio({ photos: [...s.photos, dataUrl] });
  const removePhoto = (i: number) => updateStudio({ photos: s.photos.filter((_, idx) => idx !== i) });

  return (
    <>
      <PageHeader title="Configuración" subtitle="Datos de tu negocio, fotos y personalización White-label" />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Datos del negocio */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-ink">Datos del negocio</h2>
          <Field label="Nombre del negocio">
            <input className="input" value={s.name} onChange={(e) => updateStudio({ name: e.target.value })} />
          </Field>
          <Field label="Nombre visible / Logo (texto)">
            <input className="input" value={b.logoText} onChange={(e) => updateBranding({ logoText: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Teléfono"><input className="input" value={s.phone} onChange={(e) => updateStudio({ phone: e.target.value })} /></Field>
            <Field label="Correo"><input className="input" value={s.email} onChange={(e) => updateStudio({ email: e.target.value })} /></Field>
          </div>
          <Field label="Dirección">
            <input className="input" value={s.address} onChange={(e) => updateStudio({ address: e.target.value })} />
          </Field>
          <p className="text-xs text-ink-faint">Código de Estudio Único (CEU): <span className="font-mono">{s.ceuCode}</span></p>
        </Card>

        {/* Fotos */}
        <Card className="p-6">
          <h2 className="font-semibold text-ink mb-3">Fotos del estudio</h2>
          <ImageUpload variant="dropzone" label="Subir foto desde tu dispositivo" className="w-full mb-4" onSelect={addPhoto} />
          {s.photos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-cream-dark p-8 text-center text-ink-faint text-sm">Aún no has agregado fotos.</div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {s.photos.map((p, i) => (
                <div key={i} className="relative group">
                  <img src={p} alt="" className="h-24 w-full object-cover rounded-lg" />
                  <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white text-xs">✕</button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* White-label */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-ink">White-label (branding)</h2>
          <ColorField label="Color primario" value={b.primaryColor} onChange={(v) => updateBranding({ primaryColor: v })} />
          <ColorField label="Color secundario (fondo)" value={b.secondaryColor} onChange={(v) => updateBranding({ secondaryColor: v })} />
          <ColorField label="Color de acento / texto" value={b.accentColor} onChange={(v) => updateBranding({ accentColor: v })} />
          <Field label="Tipografía">
            <select className="input" value={b.fontFamily} onChange={(e) => updateBranding({ fontFamily: e.target.value })}>
              {fonts.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </Field>
        </Card>

        {/* Vista previa White-label */}
        <Card className="p-6">
          <p className="text-xs uppercase text-ink-faint mb-3">Vista previa en vivo</p>
          <div className="rounded-2xl p-6 border" style={{ background: b.secondaryColor, borderColor: b.primaryColor }}>
            <p className="text-2xl font-black" style={{ color: b.primaryColor, fontFamily: b.fontFamily }}>{b.logoText}</p>
            <p className="mt-2" style={{ color: b.accentColor, fontFamily: b.fontFamily }}>Encuentra tu equilibrio. Reserva tu próxima clase.</p>
            <button className="mt-4 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: b.primaryColor, color: b.secondaryColor }}>Reservar clase</button>
          </div>
          <p className="mt-4 text-sm text-ink-faint">Los cambios se aplican de inmediato a toda la interfaz del estudio.</p>
        </Card>
      </div>
      <style>{`.input{width:100%;border:1px solid #E8E3D6;border-radius:.75rem;padding:.6rem .8rem;background:#fff;outline:none}.input:focus{box-shadow:0 0 0 2px var(--brand-primary)}`}</style>
    </>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-ink-soft">{label}</span>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-9 rounded-lg border border-cream-dark cursor-pointer" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="w-24 rounded-lg border border-cream-dark px-2 py-1.5 text-sm font-mono" />
      </div>
    </label>
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
