import type { ReactNode } from 'react';

/* Status badge — outlined pill, colored by tone. */
export type Tone = 'green' | 'amber' | 'orange' | 'red' | 'blue' | 'purple' | 'indigo' | 'gray';

const TONE: Record<Tone, string> = {
  green: 'text-emerald-700 bg-emerald-50 ring-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:ring-emerald-500/25',
  amber: 'text-amber-700 bg-amber-50 ring-amber-200 dark:text-amber-300 dark:bg-amber-500/10 dark:ring-amber-500/25',
  orange: 'text-orange-700 bg-orange-50 ring-orange-200 dark:text-orange-300 dark:bg-orange-500/10 dark:ring-orange-500/25',
  red: 'text-red-700 bg-red-50 ring-red-200 dark:text-red-300 dark:bg-red-500/10 dark:ring-red-500/25',
  blue: 'text-blue-700 bg-blue-50 ring-blue-200 dark:text-blue-300 dark:bg-blue-500/10 dark:ring-blue-500/25',
  purple: 'text-purple-700 bg-purple-50 ring-purple-200 dark:text-purple-300 dark:bg-purple-500/10 dark:ring-purple-500/25',
  indigo: 'text-indigo-700 bg-indigo-50 ring-indigo-200 dark:text-indigo-300 dark:bg-indigo-500/10 dark:ring-indigo-500/25',
  gray: 'text-slate-600 bg-slate-100 ring-slate-200 dark:text-slate-300 dark:bg-slate-500/15 dark:ring-slate-500/30',
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
  Chemical: 'text-purple-600 dark:text-purple-400',
  Glassware: 'text-blue-600 dark:text-blue-400',
  Consumables: 'text-emerald-600 dark:text-emerald-400',
  Equipment: 'text-indigo-600 dark:text-indigo-400',
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
        <h1 className="text-3xl font-extrabold text-[var(--text-strong)]">{title}</h1>
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
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { color?: 'blue' | 'red' | 'orange' | 'zest' }) {
  const map = {
    blue: 'bg-primary-600 text-white hover:bg-primary-700',
    red: 'bg-red-600 text-white hover:bg-red-700',
    orange: 'bg-orange-500 text-white hover:bg-orange-600',
    zest: 'bg-zest text-[#15133d] hover:bg-zest-hover',
  };
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${map[color]}`}
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
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-body)] transition-colors hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-50"
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
    <div className="flex flex-wrap items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            active === t
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-[var(--text-body)] hover:bg-[var(--surface-3)]'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

/* Empty state for lists with no data yet (e.g. before the first upload). */
export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--surface-3)] text-[var(--text-muted)]">{icon}</span>
      <p className="display mt-4 font-bold text-[var(--text-strong)]">{title}</p>
      <p className="mt-1 max-w-md text-sm muted">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
