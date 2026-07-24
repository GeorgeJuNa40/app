import { useState } from 'react';
import { useStore } from '../../lib/store';
import { PageHeader, Card, Toggle, Button } from '../../components/ui';

// Servicios opcionales: el estudio los edita (nombre, descripción y WhatsApp del
// proveedor). El alumno contacta DIRECTO a quien brinda el servicio.
export default function ServicesConfig() {
  const { currentStudio, addService, updateService, removeService } = useStore();
  const services = currentStudio!.services;
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [wa, setWa] = useState('');

  const add = () => {
    if (!name.trim()) return;
    addService(name.trim(), desc.trim(), wa.trim());
    setName('');
    setDesc('');
    setWa('');
  };

  return (
    <>
      <PageHeader title="Servicios Opcionales" subtitle="Módulos de bienestar que ofreces a tus alumnos" />

      <Card className="p-5 mb-6 bg-cream-dark/30">
        <p className="text-sm text-ink-soft">
          Cada servicio lleva al alumno <b>directo al WhatsApp de quien lo brinda</b> (nutriólogo,
          kinesiólogo, etc.). Escribe el número de contacto de cada proveedor con su código de país
          (ej. <span className="font-mono">+52 55 1234 5678</span>).
        </p>
      </Card>

      {/* Servicios existentes (editables) */}
      <div className="space-y-4">
        {services.map((sv) => (
          <Card key={sv.id} className="p-5 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nombre del servicio">
                <input className="input" value={sv.name} onChange={(e) => updateService(sv.id, { name: e.target.value })} />
              </Field>
              <Field label="WhatsApp del proveedor">
                <input
                  className="input"
                  value={sv.whatsapp ?? ''}
                  onChange={(e) => updateService(sv.id, { whatsapp: e.target.value })}
                  placeholder="+52 55 1234 5678"
                />
              </Field>
            </div>
            <Field label="Descripción">
              <input className="input" value={sv.description} onChange={(e) => updateService(sv.id, { description: e.target.value })} />
            </Field>
            <div className="flex items-center justify-between pt-1">
              <Toggle
                label="Visible para tus alumnos"
                checked={sv.enabled}
                onChange={(v) => updateService(sv.id, { enabled: v })}
              />
              {sv.custom && (
                <button onClick={() => removeService(sv.id)} className="text-sm text-red-600">
                  Eliminar
                </button>
              )}
            </div>
          </Card>
        ))}
        {services.length === 0 && (
          <Card className="p-6 text-center text-sm text-ink-faint">
            Aún no has agregado servicios. Agrega el primero abajo.
          </Card>
        )}
      </div>

      {/* Agregar nuevo */}
      <Card className="p-5 mt-6">
        <p className="font-medium text-ink mb-3">Agregar servicio</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <input className="input" placeholder="Nombre (ej. Masaje deportivo)" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="Descripción breve" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <input className="input" placeholder="WhatsApp del proveedor" value={wa} onChange={(e) => setWa(e.target.value)} />
        </div>
        <Button className="mt-3" onClick={add}>+ Agregar</Button>
      </Card>

      <style>{`.input{width:100%;border:1px solid #E8E3D6;border-radius:.75rem;padding:.6rem .8rem;background:#fff;outline:none}.input:focus{box-shadow:0 0 0 2px var(--brand-primary)}`}</style>
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
