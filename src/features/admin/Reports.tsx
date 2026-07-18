import { useMemo } from 'react';
import { useStore } from '../../lib/store';
import { PageHeader, Card, StatCard } from '../../components/ui';
import { usd } from '../../lib/format';
import type { MembershipState, PaymentMethod } from '../../lib/types';

const METHOD_LABEL: Record<PaymentMethod, string> = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', paypal: 'PayPal' };
const STATE_LABEL: Record<MembershipState, string> = { active: 'Activas', expiring: 'Por vencer', expired: 'Vencidas', none: 'Sin plan' };

export default function Reports() {
  const { db, currentStudio, studioUsers, membership } = useStore();

  const data = useMemo(() => {
    const sid = currentStudio!.id;
    const students = studioUsers('STUDENT');
    const coaches = studioUsers('COACH');
    const revenue = db.payments.reduce((a, p) => a + p.amountUsd, 0);
    const manual = db.payments.filter((p) => p.registeredBy === 'studio').reduce((a, p) => a + p.amountUsd, 0);
    const online = revenue - manual;
    const attended = db.bookings.filter((b) => b.status === 'ATTENDED').length;
    const totalBookings = db.bookings.filter((b) => b.status !== 'CANCELED').length;

    const byTemplate = db.classTemplates
      .filter((t) => t.studioId === sid)
      .map((t) => ({
        name: t.name,
        color: t.colorHex,
        count: db.bookings.filter((b) => {
          const s = db.classSessions.find((x) => x.id === b.sessionId);
          return s?.templateId === t.id && b.status !== 'CANCELED';
        }).length,
      }))
      .sort((a, b) => b.count - a.count);
    const maxCount = Math.max(1, ...byTemplate.map((x) => x.count));

    const byMethod = (['cash', 'card', 'transfer', 'paypal'] as PaymentMethod[]).map((m) => ({
      m, total: db.payments.filter((p) => p.method === m).reduce((a, p) => a + p.amountUsd, 0),
    }));
    const maxMethod = Math.max(1, ...byMethod.map((x) => x.total));

    const memberStates = { active: 0, expiring: 0, expired: 0, none: 0 } as Record<MembershipState, number>;
    for (const s of students) memberStates[membership(s.id).state]++;

    const starsIssued = db.stars.filter((s) => s.delta > 0).reduce((a, s) => a + s.delta, 0);
    const redemptions = db.stars.filter((s) => s.reason === 'redemption').length;

    return { students: students.length, coaches: coaches.length, revenue, manual, online, attended, totalBookings, byTemplate, maxCount, byMethod, maxMethod, memberStates, starsIssued, redemptions };
  }, [db, currentStudio, studioUsers, membership]);

  return (
    <>
      <PageHeader title="Reportes" subtitle="Métricas clave de desempeño de tu estudio" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard label="Ingresos totales" value={usd(data.revenue)} hint={`${usd(data.online)} en línea · ${usd(data.manual)} en estudio`} />
        <StatCard label="Reservas totales" value={data.totalBookings} hint={`${data.attended} asistencias`} />
        <StatCard label="Alumnos / Coaches" value={`${data.students} / ${data.coaches}`} />
        <StatCard label="Estrellas · canjes" value={`${data.starsIssued} · ${data.redemptions}`} icon="★" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold text-ink mb-4">Membresías por estado</h2>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(data.memberStates) as MembershipState[]).map((k) => (
              <div key={k} className="rounded-xl bg-cream-dark/40 p-4 text-center">
                <p className="text-2xl font-bold text-ink">{data.memberStates[k]}</p>
                <p className="text-xs text-ink-faint">{STATE_LABEL[k]}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-ink mb-4">Ingresos por método de pago</h2>
          <div className="space-y-3">
            {data.byMethod.map((x) => (
              <div key={x.m}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-ink-soft">{METHOD_LABEL[x.m]}</span>
                  <span className="text-ink-faint">{usd(x.total)}</span>
                </div>
                <div className="h-2.5 rounded-full bg-cream-dark overflow-hidden">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${(x.total / data.maxMethod) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h2 className="font-semibold text-ink mb-4">Popularidad por tipo de clase</h2>
          <div className="space-y-3">
            {data.byTemplate.map((t) => (
              <div key={t.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-ink-soft">{t.name}</span>
                  <span className="text-ink-faint">{t.count} reservas</span>
                </div>
                <div className="h-2.5 rounded-full bg-cream-dark overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(t.count / data.maxCount) * 100}%`, background: t.color }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
