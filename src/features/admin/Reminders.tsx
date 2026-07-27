import { useMemo } from 'react';
import { useStore } from '../../lib/store';
import { PageHeader, Card, Badge, Button, EmptyState, StatCard } from '../../components/ui';
import { fmtFullDay } from '../../lib/format';
import type { MembershipState } from '../../lib/types';

// Centro de recordatorios del estudio: detecta a quién dar seguimiento (paquete
// por vencer, vencido o sin paquete) y permite enviarle el recordatorio por
// WhatsApp con un clic (mensaje ya escrito). No requiere ningún servicio extra.

const META: Record<'expired' | 'expiring' | 'none', { label: string; tone: 'danger' | 'warning' | 'neutral'; order: number }> = {
  expired: { label: 'Vencido', tone: 'danger', order: 0 },
  expiring: { label: 'Por vencer', tone: 'warning', order: 1 },
  none: { label: 'Sin paquete', tone: 'neutral', order: 2 },
};

// Reemplaza {marcadores} sin depender de replaceAll (compatibilidad).
const fill = (text: string, map: Record<string, string>) =>
  Object.entries(map).reduce((acc, [k, v]) => acc.split(`{${k}}`).join(v), text);

export default function Reminders() {
  const { studioUsers, membership, currentStudio } = useStore();
  const students = studioUsers('STUDENT');
  const studio = currentStudio!;

  const items = useMemo(() => {
    return students
      .map((u) => ({ user: u, m: membership(u.id) }))
      .filter((x) => x.m.state !== 'active') // solo los que necesitan seguimiento
      .sort((a, b) => META[a.m.state as keyof typeof META].order - META[b.m.state as keyof typeof META].order);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students]);

  const count = (state: MembershipState) => items.filter((x) => x.m.state === state).length;

  const message = (state: MembershipState, name: string, planName: string | null, expiresAt: string | null) => {
    const nombre = name.split(' ')[0];
    const estudio = studio.branding.logoText || studio.name;
    const plan = planName ?? 'tu paquete';
    const fecha = expiresAt ? fmtFullDay(expiresAt) : '';
    if (state === 'none') {
      return `Hola ${nombre}, te escribimos de ${estudio}. Vimos que aún no tienes un paquete activo. ¿Te ayudamos a elegir uno para que reserves tus clases? 🧘`;
    }
    if (state === 'expired') {
      const tpl = studio.whatsapp.templates.find((t) => t.id === 'wt_pay')?.text;
      if (tpl) return fill(tpl, { nombre, plan, fecha, estudio });
      return `Hola ${nombre}, tu paquete ${plan} en ${estudio} ya venció${fecha ? ` (el ${fecha})` : ''}. Renúvalo en el estudio o desde la app para seguir reservando. ¡Te esperamos! 🌿`;
    }
    // expiring
    const tpl = studio.whatsapp.templates.find((t) => t.id === 'wt_pay')?.text;
    if (tpl) return fill(tpl, { nombre, plan, fecha, estudio });
    return `Hola ${nombre}, te recordamos que tu paquete ${plan} en ${estudio} está por vencer${fecha ? ` (el ${fecha})` : ''}. Renúvalo para no perder tus clases. ¡Nos vemos! 🌿`;
  };

  const waLink = (phone: string, text: string) => {
    const digits = (phone ?? '').replace(/\D/g, '');
    if (!digits) return undefined;
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
  };

  return (
    <>
      <PageHeader
        title="Recordatorios"
        subtitle="Alumnos que necesitan seguimiento — envíales un recordatorio por WhatsApp"
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <StatCard label="Vencidos" value={count('expired')} icon="⚠" />
        <StatCard label="Por vencer" value={count('expiring')} icon="⏳" />
        <StatCard label="Sin paquete" value={count('none')} icon="◇" />
      </div>

      {items.length === 0 ? (
        <EmptyState>
          🎉 Todo al día. Ningún alumno tiene paquetes vencidos o por vencer en este momento.
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map(({ user, m }) => {
            const meta = META[m.state as keyof typeof META];
            const text = message(m.state, user.fullName, m.planName, m.expiresAt);
            const link = waLink(user.phone, text);
            return (
              <Card key={user.id} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-ink">{user.fullName}</h3>
                    <p className="text-xs text-ink-faint">{user.phone || 'Sin teléfono'}</p>
                  </div>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </div>

                <p className="mt-3 text-sm text-ink-soft">
                  {m.state === 'none' ? (
                    'Aún no ha comprado ningún paquete.'
                  ) : (
                    <>
                      Paquete <strong>{m.planName ?? '—'}</strong> ·{' '}
                      {m.state === 'expired' ? 'venció' : 'vence'}{' '}
                      {m.expiresAt ? fmtFullDay(m.expiresAt) : ''} · {Math.max(0, m.creditsLeft)} clase(s) restante(s)
                    </>
                  )}
                </p>

                <div className="mt-4">
                  {link ? (
                    <a href={link} target="_blank" rel="noreferrer">
                      <Button className="w-full">Recordar por WhatsApp</Button>
                    </a>
                  ) : (
                    <Button className="w-full" variant="secondary" disabled>
                      Sin teléfono registrado
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-xs text-ink-faint">
        💡 El mensaje se abre en WhatsApp ya escrito; tú solo confirmas el envío. Puedes personalizar
        la plantilla de pago en <strong>WhatsApp IA</strong>.
      </p>
    </>
  );
}
