import { useStore } from '../../lib/store';
import { PageHeader, Card, Button, EmptyState } from '../../components/ui';

// Alumno: servicios activados por el estudio. El botón lleva DIRECTO al WhatsApp
// del proveedor de cada servicio (no al del estudio).
export default function OptionalServices() {
  const { currentStudio } = useStore();
  const services = currentStudio!.services.filter((s) => s.enabled);

  const waLink = (num: string | undefined, service: string) => {
    const digits = (num ?? '').replace(/\D/g, '');
    if (!digits) return undefined;
    return `https://wa.me/${digits}?text=${encodeURIComponent(
      `Hola, quiero información sobre el servicio de ${service}.`,
    )}`;
  };

  return (
    <>
      <PageHeader title="Servicios" subtitle="Bienestar integral más allá de la clase" />
      {services.length === 0 ? (
        <EmptyState>Tu estudio aún no ha activado servicios opcionales.</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {services.map((s) => {
            const link = waLink(s.whatsapp, s.name);
            return (
              <Card key={s.id} className="p-6 flex flex-col">
                <div className="text-4xl">✚</div>
                <h3 className="mt-3 font-semibold text-ink">{s.name}</h3>
                <p className="text-sm text-ink-faint mt-1 flex-1">{s.description}</p>
                {link ? (
                  <a href={link} target="_blank" rel="noreferrer" className="mt-4">
                    <Button className="w-full">Contactar por WhatsApp</Button>
                  </a>
                ) : (
                  <Button className="mt-4" variant="secondary" disabled>
                    Contacto no disponible
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
