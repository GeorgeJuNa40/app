import { useMemo, useState } from 'react';
import { useStore } from '../../lib/store';
import { PageHeader, Card, StatCard } from '../../components/ui';
import { usd } from '../../lib/format';
import type { MembershipState, PaymentMethod } from '../../lib/types';

const METHOD_LABEL: Record<PaymentMethod, string> = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', paypal: 'PayPal' };
const STATE_LABEL: Record<MembershipState, string> = { active: 'Activas', expiring: 'Por vencer', expired: 'Vencidas', none: 'Sin plan' };

const MONTH_FMT = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' });
const MONTH_SHORT = new Intl.DateTimeFormat('es-MX', { month: 'short' });
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface Period {
  key: string;
  label: string;
  short: string;
  start: number; // ms (inclusive)
  end: number; // ms (exclusivo)
}

export default function Reports() {
  const { db, currentStudio, studioUsers, membership } = useStore();

  // Historial: "Todo el tiempo" + cada uno de los últimos 12 meses.
  const periods = useMemo<Period[]>(() => {
    const now = new Date();
    const months: Period[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = d.getTime();
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
      const label = i === 0 ? `Este mes · ${cap(MONTH_FMT.format(d))}` : cap(MONTH_FMT.format(d));
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label, short: cap(MONTH_SHORT.format(d)), start, end });
    }
    return [{ key: 'all', label: 'Todo el tiempo', short: 'Todo', start: 0, end: Infinity }, ...months];
  }, []);

  // Por defecto arrancamos en el mes actual (día a día); se puede ver el historial.
  const [periodKey, setPeriodKey] = useState<string>(periods[1]?.key ?? 'all');
  const period = periods.find((p) => p.key === periodKey) ?? periods[0];

  const data = useMemo(() => {
    const sid = currentStudio!.id;
    const students = studioUsers('STUDENT');
    const coaches = studioUsers('COACH');

    const sessById = new Map(db.classSessions.map((s) => [s.id, s]));
    const inRange = (iso?: string | null) => {
      if (period.key === 'all') return true;
      if (!iso) return false;
      const t = new Date(iso).getTime();
      return t >= period.start && t < period.end;
    };

    // Pagos del periodo (por fecha de pago).
    const pays = db.payments.filter((p) => inRange(p.paidAt));
    const revenue = pays.reduce((a, p) => a + p.amountUsd, 0);
    const manual = pays.filter((p) => p.registeredBy === 'studio').reduce((a, p) => a + p.amountUsd, 0);
    const online = revenue - manual;

    // Reservas del periodo (por fecha de la clase).
    const bookingsInRange = db.bookings.filter((b) => b.status !== 'CANCELED' && inRange(sessById.get(b.sessionId)?.startsAt));
    const attended = db.bookings.filter((b) => b.status === 'ATTENDED' && inRange(sessById.get(b.sessionId)?.startsAt)).length;
    const totalBookings = bookingsInRange.length;

    const byTemplate = db.classTemplates
      .filter((t) => t.studioId === sid)
      .map((t) => ({
        name: t.name,
        color: t.colorHex,
        count: bookingsInRange.filter((b) => sessById.get(b.sessionId)?.templateId === t.id).length,
      }))
      .sort((a, b) => b.count - a.count);
    const maxCount = Math.max(1, ...byTemplate.map((x) => x.count));

    const byMethod = (['cash', 'card', 'transfer', 'paypal'] as PaymentMethod[]).map((m) => ({
      m, total: pays.filter((p) => p.method === m).reduce((a, p) => a + p.amountUsd, 0),
    }));
    const maxMethod = Math.max(1, ...byMethod.map((x) => x.total));

    // Estado de membresías: es una foto ACTUAL (no depende del mes elegido).
    const memberStates = { active: 0, expiring: 0, expired: 0, none: 0 } as Record<MembershipState, number>;
    for (const s of students) memberStates[membership(s.id).state]++;

    const starsIssued = db.stars.filter((s) => s.delta > 0 && inRange(s.createdAt)).reduce((a, s) => a + s.delta, 0);
    const redemptions = db.stars.filter((s) => s.reason === 'redemption' && inRange(s.createdAt)).length;

    // Tendencia: ingresos de cada uno de los últimos 12 meses (más viejo -> más nuevo).
    const monthly = periods
      .filter((p) => p.key !== 'all')
      .map((p) => ({
        key: p.key,
        short: p.short,
        total: db.payments
          .filter((pay) => { const t = new Date(pay.paidAt).getTime(); return t >= p.start && t < p.end; })
          .reduce((a, pay) => a + pay.amountUsd, 0),
      }))
      .reverse();
    const maxMonthly = Math.max(1, ...monthly.map((x) => x.total));

    return { students: students.length, coaches: coaches.length, revenue, manual, online, attended, totalBookings, byTemplate, maxCount, byMethod, maxMethod, memberStates, starsIssued, redemptions, monthly, maxMonthly };
  }, [db, currentStudio, studioUsers, membership, period, periods]);

  return (
    <>
      <PageHeader title="Reportes" subtitle="Métricas de tu estudio — elige un mes para ver su historial" />

      {/* Selector de periodo (historial hasta 12 meses atrás) */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {periods.map((p) => {
          const active = p.key === period.key;
          return (
            <button
              key={p.key}
              onClick={() => setPeriodKey(p.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                active ? 'bg-brand text-cream-light shadow-card' : 'bg-white text-ink-soft ring-1 ring-black/[0.06] hover:bg-brand-soft'
              }`}
            >
              {p.key === 'all' ? 'Todo el tiempo' : active ? p.label : p.short + ' ' + p.key.split('-')[0]}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard label="Ingresos" value={usd(data.revenue)} hint={`${usd(data.online)} en línea · ${usd(data.manual)} en estudio`} />
        <StatCard label="Reservas" value={data.totalBookings} hint={`${data.attended} asistencias`} />
        <StatCard label="Alumnos / Coaches" value={`${data.students} / ${data.coaches}`} hint="Total actual del estudio" />
        <StatCard label="Estrellas · canjes" value={`${data.starsIssued} · ${data.redemptions}`} icon="★" />
      </div>

      {/* Tendencia mensual de ingresos (12 meses) — toca una barra para ver ese mes */}
      <Card className="p-6 mb-6">
        <h2 className="font-semibold text-ink mb-1">Ingresos por mes</h2>
        <p className="text-xs text-ink-faint mb-4">Últimos 12 meses · toca un mes para ver su detalle</p>
        <div className="flex items-end gap-1.5 sm:gap-2 h-44">
          {data.monthly.map((m) => {
            const active = m.key === period.key;
            const h = Math.max(4, (m.total / data.maxMonthly) * 100);
            return (
              <button
                key={m.key}
                onClick={() => setPeriodKey(m.key)}
                className="group flex flex-1 flex-col items-center justify-end h-full gap-1"
                title={`${m.short}: ${usd(m.total)}`}
              >
                <span className={`text-[10px] font-semibold tabular-nums ${active ? 'text-brand' : 'text-ink-faint opacity-0 group-hover:opacity-100'}`}>
                  {m.total > 0 ? usd(m.total).replace(/\s\w+$/, '') : ''}
                </span>
                <div
                  className={`w-full rounded-t-lg transition-all ${active ? 'bg-brand' : 'bg-brand-soft group-hover:bg-mint'}`}
                  style={{ height: `${h}%` }}
                />
                <span className={`text-[10px] ${active ? 'font-bold text-brand' : 'text-ink-faint'}`}>{m.short}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-semibold text-ink">Membresías por estado</h2>
            <span className="text-xs text-ink-faint">Actual</span>
          </div>
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
          {data.byMethod.every((x) => x.total === 0) ? (
            <p className="text-sm text-ink-faint">Sin pagos registrados en este periodo.</p>
          ) : (
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
          )}
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h2 className="font-semibold text-ink mb-4">Popularidad por tipo de clase</h2>
          {data.byTemplate.every((t) => t.count === 0) ? (
            <p className="text-sm text-ink-faint">Sin reservas en este periodo.</p>
          ) : (
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
          )}
        </Card>
      </div>
    </>
  );
}
