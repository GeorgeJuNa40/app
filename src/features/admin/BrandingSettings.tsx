import { useStore } from '../../lib/store';
import { PageHeader, Card } from '../../components/ui';

// White Label: el estudio edita colores, tipografía y logo en vivo.
export default function BrandingSettings() {
  const { currentStudio, updateBranding } = useStore();
  const b = currentStudio!.branding;

  const fonts = ['Inter', 'Georgia', 'Poppins', 'system-ui'];

  return (
    <>
      <PageHeader
        title="Branding (White Label)"
        subtitle="Personaliza la identidad visual de tu estudio en tiempo real"
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6 space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">Nombre / Logo (texto)</span>
            <input
              className="mt-1 w-full rounded-xl border border-cream-dark px-4 py-2.5 outline-none focus:ring-2 ring-brand"
              value={b.logoText}
              onChange={(e) => updateBranding({ logoText: e.target.value })}
            />
          </label>

          <ColorField
            label="Color primario"
            value={b.primaryColor}
            onChange={(v) => updateBranding({ primaryColor: v })}
          />
          <ColorField
            label="Color secundario (fondo)"
            value={b.secondaryColor}
            onChange={(v) => updateBranding({ secondaryColor: v })}
          />
          <ColorField
            label="Color de acento / texto"
            value={b.accentColor}
            onChange={(v) => updateBranding({ accentColor: v })}
          />

          <label className="block">
            <span className="text-sm font-medium text-ink-soft">Tipografía</span>
            <select
              className="mt-1 w-full rounded-xl border border-cream-dark px-4 py-2.5 outline-none focus:ring-2 ring-brand bg-white"
              value={b.fontFamily}
              onChange={(e) => updateBranding({ fontFamily: e.target.value })}
            >
              {fonts.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>
        </Card>

        {/* Vista previa en vivo */}
        <Card className="p-6">
          <p className="text-xs uppercase text-ink-faint mb-3">Vista previa en vivo</p>
          <div
            className="rounded-2xl p-6 border"
            style={{ background: b.secondaryColor, borderColor: b.primaryColor }}
          >
            <p
              className="text-2xl font-black"
              style={{ color: b.primaryColor, fontFamily: b.fontFamily }}
            >
              {b.logoText}
            </p>
            <p className="mt-2" style={{ color: b.accentColor, fontFamily: b.fontFamily }}>
              Encuentra tu equilibrio. Reserva tu próxima clase de Pilates.
            </p>
            <button
              className="mt-4 rounded-xl px-4 py-2 text-sm font-semibold"
              style={{ background: b.primaryColor, color: b.secondaryColor }}
            >
              Reservar clase
            </button>
          </div>
          <p className="mt-4 text-sm text-ink-faint">
            Los cambios se aplican de inmediato a toda la interfaz de tu estudio.
          </p>
        </Card>
      </div>
    </>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-ink-soft">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 rounded-lg border border-cream-dark cursor-pointer"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 rounded-lg border border-cream-dark px-2 py-1.5 text-sm font-mono"
        />
      </div>
    </label>
  );
}
