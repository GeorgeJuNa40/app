import { useStore } from '../../lib/store';
import { PageHeader, Card, Toggle } from '../../components/ui';

// Modulación: los servicios opcionales se activan/desactivan por toggle.
export default function ServicesConfig() {
  const { currentStudio, updateServiceConfig } = useStore();
  const cfg = currentStudio!.serviceConfig;

  return (
    <>
      <PageHeader
        title="Servicios Opcionales"
        subtitle="Activa los módulos que ofrece tu estudio a los alumnos"
      />
      <Card className="p-6 max-w-2xl">
        <div className="divide-y divide-cream-dark">
          <Toggle
            label="Nutrición"
            description="Consultas y planes nutricionales personalizados."
            checked={cfg.nutritionEnabled}
            onChange={(v) => updateServiceConfig({ nutritionEnabled: v })}
          />
          <Toggle
            label="Kinesiología"
            description="Sesiones de rehabilitación y prevención de lesiones."
            checked={cfg.kinesiologyEnabled}
            onChange={(v) => updateServiceConfig({ kinesiologyEnabled: v })}
          />
          <Toggle
            label="Medicina Deportiva"
            description="Valoración médica y seguimiento del rendimiento."
            checked={cfg.sportsMedicineEnabled}
            onChange={(v) => updateServiceConfig({ sportsMedicineEnabled: v })}
          />
        </div>
        <p className="mt-4 text-sm text-ink-faint">
          Los módulos activados aparecerán automáticamente en la sección "Servicios" de tus
          alumnos.
        </p>
      </Card>
    </>
  );
}
