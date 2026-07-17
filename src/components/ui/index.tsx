import type { ButtonHTMLAttributes, ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Primitivas UI compartidas — estilo "Zen Balance" (minimalista, wellness).
// ---------------------------------------------------------------------------

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed';
  const styles: Record<string, string> = {
    primary: 'bg-brand text-cream hover:opacity-90 shadow-zen',
    secondary: 'bg-cream-dark text-ink hover:bg-cream',
    ghost: 'bg-transparent text-brand hover:bg-cream-dark',
    danger: 'bg-red-50 text-red-700 hover:bg-red-100',
  };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-white border border-cream-dark shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'brand';
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-cream-dark text-ink-soft',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-700',
    brand: 'bg-brand text-cream',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-faint">{label}</p>
          <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
          {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
        </div>
        {icon && <div className="text-2xl text-brand">{icon}</div>}
      </div>
    </Card>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer py-3">
      <div>
        <p className="font-medium text-ink">{label}</p>
        {description && <p className="text-sm text-ink-faint">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? 'bg-brand' : 'bg-cream-dark'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </label>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="text-ink-faint mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-cream-dark p-10 text-center text-ink-faint">
      {children}
    </div>
  );
}
