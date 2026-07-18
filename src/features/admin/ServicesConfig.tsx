import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../lib/store';
import { PageHeader, Card, Toggle, Button } from '../../components/ui';

// Servicios opcionales: el estudio activa/desactiva y agrega/quita los suyos.
export default function ServicesConfig() {
  const { currentStudio, addService, updateService, removeService } = useStore();
  const services = currentStudio!.services;
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const add = () => {
    if (!name.trim()) return;
    addService(name.trim(), desc.trim());
    setName('');
    setDesc('');
  };

  return (
    <>
      <PageHeader title="Servicios Opcionales" subtitle="Módulos de bienestar que ofreces a tus alumnos" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="divide-y divide-cream-dark">
            {services.map((sv) => (
              <div key={sv.id} className="flex items-center gap-3 py-1">
                <div className="flex-1">
                  <Toggle
                    label={sv.name}
                    description={sv.description}
                    checked={sv.enabled}
                    onChange={(v) => updateService(sv.id, { enabled: v })}
                  />
                </div>
                {sv.custom && (
                  <button
                    onClick={() => removeService(sv.id)}
                    className="text-red-600 text-sm shrink-0"
                    title="Eliminar servicio"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-cream-dark pt-5">
            <p className="font-medium text-ink mb-2">Agregar servicio</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <input className="input" placeholder="Nombre (ej. Masaje deportivo)" value={name} onChange={(e) => setName(e.target.value)} />
              <input className="input" placeholder="Descripción breve" value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
            <Button className="mt-3" onClick={add}>+ Agregar</Button>
          </div>
        </Card>

        <Card className="p-6 h-fit">
          <h2 className="font-semibold text-ink mb-2">Contacto por WhatsApp</h2>
          <p className="text-sm text-ink-soft">
            Los alumnos verán un botón que los lleva a tu WhatsApp para agendar estos servicios.
            El número se configura en la sección{' '}
            <Link to="/admin/whatsapp" className="text-brand font-medium">WhatsApp IA</Link>.
          </p>
          <p className="mt-3 text-sm text-ink-faint">
            Número actual: <span className="font-mono">{currentStudio!.whatsapp.number || 'sin configurar'}</span>
          </p>
        </Card>
      </div>
      <style>{`.input{width:100%;border:1px solid #E8E3D6;border-radius:.75rem;padding:.6rem .8rem;background:#fff;outline:none}.input:focus{box-shadow:0 0 0 2px var(--brand-primary)}`}</style>
    </>
  );
}
