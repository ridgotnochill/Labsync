import { useState } from 'react';
import { TrendingDown, Wrench, Clock, CheckCircle2, TriangleAlert, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { notifications as seed } from '../data';
import type { NotifTone } from '../data';
import { PageHeader } from '../components/ui';

const ICONS: Record<string, LucideIcon> = {
  trend: TrendingDown, wrench: Wrench, clock: Clock, check: CheckCircle2, alert: TriangleAlert, info: Info,
};
const TONE_BG: Record<NotifTone, string> = {
  orange: 'bg-orange-50 dark:bg-orange-500/10 text-orange-500',
  amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-500',
  red: 'bg-red-50 dark:bg-red-500/10 text-red-500',
  green: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500',
  blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-500',
};

export default function Notifications() {
  const [items, setItems] = useState(seed);
  const unread = items.filter((n) => n.unread).length;

  const markAll = () => setItems((xs) => xs.map((n) => ({ ...n, unread: false })));
  const markOne = (i: number) =>
    setItems((xs) => xs.map((n, idx) => (idx === i ? { ...n, unread: false } : n)));

  return (
    <div>
      <PageHeader
        title="Notification Center"
        subtitle={`${unread} unread notification${unread === 1 ? '' : 's'} — click to mark as read`}
        actions={
          <button
            onClick={markAll}
            className="rounded-full border border-primary-200 dark:border-primary-500/25 bg-primary-50 dark:bg-primary-500/10 px-3.5 py-2 text-sm font-medium text-primary-700 dark:text-primary-400 transition-colors hover:bg-primary-100 dark:hover:bg-primary-500/20"
          >
            Mark all as read
          </button>
        }
      />

      <div className="card divide-y divide-[var(--border)] overflow-hidden">
        {items.map((n, i) => {
          const Icon = ICONS[n.icon];
          return (
            <button
              key={i}
              onClick={() => markOne(i)}
              className={`flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--surface-2)] ${
                n.unread ? 'bg-primary-50/30 dark:bg-primary-500/10' : ''
              }`}
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${TONE_BG[n.tone]}`}>
                <Icon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--text-strong)]">{n.title}</span>
                  {n.unread && <span className="h-2 w-2 rounded-full bg-primary-500" />}
                </div>
                <p className="mt-0.5 text-sm muted">{n.body}</p>
              </div>
              <span className="shrink-0 whitespace-nowrap text-xs faint">{n.time}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
