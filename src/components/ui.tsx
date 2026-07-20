import type { ReactNode } from 'react';

/* Status badge — outlined pill, colored by tone. */
export type Tone = 'green' | 'amber' | 'orange' | 'red' | 'blue' | 'purple' | 'indigo' | 'gray';

const TONE: Record<Tone, string> = {
  green: 'text-emerald-700 bg-emerald-50 ring-emerald-200',
  amber: 'text-amber-700 bg-amber-50 ring-amber-200',
  orange: 'text-orange-700 bg-orange-50 ring-orange-200',
  red: 'text-red-700 bg-red-50 ring-red-200',
  blue: 'text-blue-700 bg-blue-50 ring-blue-200',
  purple: 'text-purple-700 bg-purple-50 ring-purple-200',
  indigo: 'text-indigo-700 bg-indigo-50 ring-indigo-200',
  gray: 'text-slate-600 bg-slate-100 ring-slate-200',
};

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}

/* Colored category text (Inventory table). */
export const CATEGORY_TONE: Record<string, string> = {
  Chemical: 'text-purple-600',
  Glassware: 'text-blue-600',
  Consumables: 'text-emerald-600',
  Equipment: 'text-indigo-600',
};

/* Page header with title, subtitle, and right-aligned actions. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

/* Buttons */
export function BtnPrimary({
  children,
  color = 'blue',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { color?: 'blue' | 'red' | 'orange' }) {
  const map = {
    blue: 'bg-primary-600 hover:bg-primary-700',
    red: 'bg-red-600 hover:bg-red-700',
    orange: 'bg-orange-500 hover:bg-orange-600',
  };
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors ${map[color]}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function BtnGhost({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      {...rest}
    >
      {children}
    </button>
  );
}

/* Filter tab bar */
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange: (t: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[var(--border)] bg-white p-1">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
            active === t
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
