// Página PÚBLICA (sin iniciar sesión) de Términos y Condiciones de Move yA.
// Complementa el Aviso de Privacidad; se enlaza desde el registro y sirve para
// cumplir requisitos de Stripe y tiendas de apps. Contenido estándar ajustable.
const UPDATED = '7 de agosto de 2026';
const CONTACT_EMAIL = 'soporte@moveya.app';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-cream px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="text-2xl font-black text-brand">Move yA</p>
          <h1 className="mt-3 text-3xl font-bold text-ink">Términos y Condiciones</h1>
          <p className="mt-2 text-sm text-ink-faint">Última actualización: {UPDATED}</p>
        </div>

        <div className="space-y-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <Section title="1. Aceptación de los términos">
            <p>
              Al crear una cuenta o usar Move yA (la "Plataforma") aceptas estos Términos y
              Condiciones y nuestro Aviso de Privacidad. Si no estás de acuerdo, no uses la
              Plataforma.
            </p>
          </Section>

          <Section title="2. Descripción del servicio">
            <p>
              Move yA es un software que ayuda a estudios de Pilates y fitness a gestionar reservas,
              paquetes, pagos, coaches, recompensas, reportes y comunicación con sus alumnos. Move yA
              provee la herramienta; cada estudio es responsable de operar su propio negocio.
            </p>
          </Section>

          <Section title="3. Cuentas y registro">
            <ul className="list-disc space-y-1 pl-5">
              <li>Debes proporcionar información veraz y mantener segura tu contraseña.</li>
              <li>Eres responsable de la actividad realizada desde tu cuenta.</li>
              <li>El estudio es responsable de las cuentas de sus coaches y alumnos.</li>
            </ul>
          </Section>

          <Section title="4. Planes, precios y pagos">
            <ul className="list-disc space-y-1 pl-5">
              <li>Los planes de suscripción (Inicio, Pro, Premium) se cobran de forma mensual.</li>
              <li>
                La prueba de lanzamiento tiene un costo y una duración indicados al contratarla; al
                terminar, el acceso al panel se limita hasta que elijas y pagues un plan.
              </li>
              <li>
                Las suscripciones se renuevan automáticamente cada periodo hasta que las canceles.
                Puedes cancelar cuando quieras; el acceso continúa hasta el fin del periodo pagado.
              </li>
              <li>
                Los pagos se procesan de forma segura mediante Stripe. Los cobros a alumnos se
                realizan directamente en la cuenta del estudio; Move yA puede aplicar una comisión de
                plataforma informada previamente.
              </li>
              <li>Salvo que la ley aplicable indique lo contrario, los pagos no son reembolsables.</li>
            </ul>
          </Section>

          <Section title="5. Uso aceptable">
            <p>Al usar la Plataforma te comprometes a no:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Usarla para fines ilícitos o sin autorización de los titulares de los datos.</li>
              <li>Enviar spam o mensajes no solicitados a través de los canales del estudio.</li>
              <li>Intentar vulnerar la seguridad, copiar o revender la Plataforma.</li>
            </ul>
          </Section>

          <Section title="6. Contenido y datos del estudio">
            <p>
              El contenido que cargas (logo, textos, datos de alumnos, etc.) sigue siendo tuyo. Nos
              otorgas una licencia limitada para almacenarlo y mostrarlo con el único fin de prestar
              el servicio. Cada estudio es responsable de tratar los datos de sus alumnos conforme a
              la ley y a nuestro Aviso de Privacidad.
            </p>
          </Section>

          <Section title="7. Mensajería y WhatsApp">
            <p>
              Si el estudio activa la función de WhatsApp, su uso está sujeto además a las políticas
              de Meta/WhatsApp. El estudio es responsable de obtener el consentimiento de sus alumnos
              para recibir mensajes y de usar la función de forma adecuada.
            </p>
          </Section>

          <Section title="8. Propiedad intelectual">
            <p>
              La Plataforma, su código, marca y diseño pertenecen a Move yA. Estos Términos no te
              transfieren derechos sobre la Plataforma salvo el uso permitido durante tu suscripción.
            </p>
          </Section>

          <Section title="9. Disponibilidad y cambios">
            <p>
              Trabajamos para mantener la Plataforma disponible, pero puede haber interrupciones por
              mantenimiento o causas ajenas. Podemos mejorar, modificar o descontinuar funciones;
              avisaremos de cambios relevantes cuando sea razonable.
            </p>
          </Section>

          <Section title="10. Limitación de responsabilidad">
            <p>
              La Plataforma se ofrece "tal cual". En la medida permitida por la ley, Move yA no será
              responsable por daños indirectos o pérdida de ingresos derivados del uso o imposibilidad
              de uso del servicio. Nuestra responsabilidad total se limita a lo que hayas pagado en
              los últimos tres meses.
            </p>
          </Section>

          <Section title="11. Terminación">
            <p>
              Puedes dejar de usar la Plataforma y cancelar tu suscripción cuando quieras. Podemos
              suspender o terminar cuentas que incumplan estos Términos o la ley.
            </p>
          </Section>

          <Section title="12. Cambios a estos Términos">
            <p>
              Podemos actualizar estos Términos ocasionalmente. Publicaremos la versión vigente en
              esta página con su fecha de actualización; el uso continuado implica su aceptación.
            </p>
          </Section>

          <Section title="13. Contacto">
            <p>
              Para cualquier duda sobre estos Términos escríbenos a{' '}
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
