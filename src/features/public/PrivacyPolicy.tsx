// Página PÚBLICA (sin iniciar sesión) de Política de Privacidad de Move yA.
// Se usa para publicar la app en Meta/WhatsApp y para dar transparencia a los
// usuarios. Contenido estándar; el estudio/plataforma puede ajustarlo.
import { Link } from 'react-router-dom';

const UPDATED = '5 de agosto de 2026';
const CONTACT_EMAIL = 'soporte@moveya.app';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-cream px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline">
          ← Volver a Move yA
        </Link>
        <div className="mb-8 text-center">
          <p className="text-2xl font-black text-brand">Move yA</p>
          <h1 className="mt-3 text-3xl font-bold text-ink">Política de Privacidad</h1>
          <p className="mt-2 text-sm text-ink-faint">Última actualización: {UPDATED}</p>
        </div>

        <div className="space-y-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <Section title="1. Quiénes somos">
            <p>
              Move yA es una plataforma de software que ayuda a estudios de Pilates y
              fitness a gestionar reservas, paquetes, pagos, recompensas y comunicación
              con sus alumnos. Esta política explica qué datos tratamos, para qué y con
              quién se comparten.
            </p>
          </Section>

          <Section title="2. Qué información recopilamos">
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>Datos de cuenta:</strong> nombre, correo, teléfono y fecha de nacimiento.</li>
              <li><strong>Datos de uso del estudio:</strong> reservas, asistencia, paquetes y recompensas.</li>
              <li><strong>Datos de pago:</strong> se procesan de forma segura a través de Stripe; Move yA
                no almacena números completos de tarjeta.</li>
              <li><strong>Mensajería:</strong> si el estudio usa WhatsApp, tratamos los mensajes
                enviados/recibidos para atender tus consultas.</li>
              <li><strong>Datos técnicos:</strong> información básica del dispositivo y registros de acceso
                para seguridad y buen funcionamiento.</li>
            </ul>
          </Section>

          <Section title="3. Cómo usamos tu información">
            <ul className="list-disc space-y-1 pl-5">
              <li>Operar el servicio (reservas, pagos, recompensas y comunicación).</li>
              <li>Enviar avisos y recordatorios relacionados con tus clases y pagos.</li>
              <li>Responder tus consultas por los canales del estudio (incluido WhatsApp).</li>
              <li>Mejorar la seguridad, prevenir fraudes y cumplir obligaciones legales.</li>
            </ul>
          </Section>

          <Section title="4. Con quién compartimos datos">
            <p>Compartimos datos únicamente con proveedores necesarios para operar el servicio:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>Stripe:</strong> procesamiento de pagos.</li>
              <li><strong>Supabase:</strong> almacenamiento seguro de la base de datos.</li>
              <li><strong>Meta / WhatsApp:</strong> envío y recepción de mensajes cuando el estudio
                activa esa función.</li>
            </ul>
            <p className="mt-2">
              No vendemos tus datos personales. Cada estudio es responsable de la información de
              sus propios alumnos.
            </p>
          </Section>

          <Section title="5. Conservación de datos">
            <p>
              Conservamos tus datos mientras tu cuenta esté activa o mientras sean necesarios para
              prestar el servicio y cumplir obligaciones legales. Puedes solicitar su eliminación
              como se indica abajo.
            </p>
          </Section>

          <Section title="6. Tus derechos">
            <p>
              Puedes solicitar acceder, rectificar, actualizar o eliminar tus datos personales, así
              como oponerte a ciertos tratamientos. Para ejercer estos derechos, contactanos al
              correo indicado abajo o a través de tu estudio.
            </p>
          </Section>

          <Section title="7. Seguridad">
            <p>
              Aplicamos medidas técnicas y organizativas razonables para proteger tu información. El
              acceso a los datos está restringido y los pagos se procesan bajo el cumplimiento PCI de
              Stripe.
            </p>
          </Section>

          <Section title="8. Menores de edad">
            <p>
              Si un alumno es menor de edad, su registro y datos deben ser proporcionados o
              autorizados por su padre, madre o tutor.
            </p>
          </Section>

          <Section title="9. Cambios a esta política">
            <p>
              Podemos actualizar esta política ocasionalmente. Publicaremos la versión vigente en
              esta misma página con su fecha de actualización.
            </p>
          </Section>

          <Section title="10. Contacto">
            <p>
              Si tienes dudas sobre esta política o el tratamiento de tus datos, escríbenos a{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-brand">
                {CONTACT_EMAIL}
              </a>.
            </p>
          </Section>
        </div>

        <p className="mt-6 text-center text-xs text-ink-faint">
          Move yA · Plataforma para estudios de Pilates y fitness
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold text-ink">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}
