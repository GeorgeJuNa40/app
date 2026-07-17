import { useStore } from '../../lib/store';
import { PageHeader, Card, Button, EmptyState } from '../../components/ui';

// Alumno: acceso a servicios opcionales, según los toggles activados por el estudio.
const SERVICES = [
  {
    key: 'nutritionEnabled' as const,
    title: 'Nutrición',
    icon: '🥗',
    desc: 'Planes de alimentación y seguimiento con nuestro nutriólogo.',
  },
  {
    key: 'kinesiologyEnabled' as const,
    title: 'Kinesiología',
    icon: '🦵',
    desc: 'Rehabilitación, movilidad y prevención de lesiones.',
  },
  {
    key: 'sportsMedicineEnabled' as const,
    title: 'Medicina Deportiva',
    icon: '🩺',
    desc: 'Valoración médica y optimización del rendimiento.',
  },
];

export default function OptionalServices() {
  const { currentStudio } = useStore();
  const cfg = currentStudio!.serviceConfig;
  const available = SERVICES.filter((s) => cfg[s.key]);

  return (
    <>
      <PageHeader
        title="Servicios"
        subtitle="Bienestar integral más allá de la clase"
      />
      {available.length === 0 ? (
        <EmptyState>Tu estudio aún no ha activado servicios opcionales.</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {available.map((s) => (
            <Card key={s.key} className="p-6 flex flex-col">
              <div className="text-4xl">{s.icon}</div>
              <h3 className="mt-3 font-semibold text-ink">{s.title}</h3>
              <p className="text-sm text-ink-faint mt-1 flex-1">{s.desc}</p>
              <Button className="mt-4" variant="secondary">
                Agendar sesión
              </Button>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
