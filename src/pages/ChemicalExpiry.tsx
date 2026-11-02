import { Download, CalendarClock } from 'lucide-react';
import type { ExpiryStatus } from '../data';
import { Badge, BtnGhost, EmptyState, PageHeader } from '../components/ui';
import type { Tone } from '../components/ui';
import { UploadButton } from '../components/UploadModal';
import { useLabData } from '../lib/labStore';
import { summarize } from '../lib/summary';

const STATUS_TONE: Record<ExpiryStatus, Tone> = {
  Critical: 'red',
  Warning: 'amber',
  Safe: 'green',
};
const DAYS_COLOR: Record<ExpiryStatus, string> = {
  Critical: 'text-red-600 dark:text-red-400',
  Warning: 'text-amber-600 dark:text-amber-400',
  Safe: 'text-emerald-600 dark:text-emerald-400',
};

const SUMMARY: { label: string; status: ExpiryStatus; dot: string; ring: string }[] = [
  { label: 'Critical (≤ 14 days)', status: 'Critical', dot: 'bg-red-500', ring: 'border-red-200 dark:border-red-500/25 bg-red-50/50 dark:bg-red-500/10' },
  { label: 'Warning (15–60 days)', status: 'Warning', dot: 'bg-amber-500', ring: 'border-amber-200 dark:border-amber-500/25 bg-amber-50/50 dark:bg-amber-500/10' },
  { label: 'Safe (> 60 days)', status: 'Safe', dot: 'bg-emerald-500', ring: 'border-emerald-200 dark:border-emerald-500/25 bg-emerald-50/50 dark:bg-emerald-500/10' },
];

const daysLabel = (d: number) => (d < 0 ? `Expired ${-d} day${d === -1 ? '' : 's'} ago` : d === 0 ? 'Expires today' : `${d} day${d === 1 ? '' : 's'}`);

export default function ChemicalExpiry() {
  const { inventory, equipment } = useLabData();
  const { withExpiry } = summarize(inventory, equipment);
  const count = (s: ExpiryStatus) => withExpiry.filter((c) => c.expiryStatus === s).length;

  return (
    <div>
      <PageHeader
        title="Chemical Expiry Tracker"
        subtitle="Monitor expiry dates and plan safe disposal or procurement"
        actions={<BtnGhost><Download size={16} /> Export Report</BtnGhost>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {SUMMARY.map((s) => (
          <div key={s.label} className={`flex items-center justify-between rounded-2xl border px-5 py-4 ${s.ring}`}>
            <span className="flex items-center gap-2 text-sm font-medium text-[var(--text-body)]">
              <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} /> {s.label}
            </span>
            <span className="text-2xl font-bold tnum text-[var(--text-strong)]">{count(s.status)}</span>
          </div>
        ))}
      </div>

      {withExpiry.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon={<CalendarClock size={24} />}
            title="No expiry dates yet"
            text="Items with an expiry date in your uploaded stock list will be tracked here, soonest first."
            action={inventory.length === 0 ? <UploadButton /> : undefined}
          />
        </div>
      ) : (
        <div className="card mt-5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  <th className="px-5 py-3.5">Item</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Quantity</th>
                  <th className="px-5 py-3.5">Expiry Date</th>
                  <th className="px-5 py-3.5">Days Remaining</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {withExpiry.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-[var(--surface-2)]">
                    <td className="px-5 py-4 font-semibold text-[var(--text-strong)]">{c.name}</td>
                    <td className="px-5 py-4 muted">{c.location || '—'}</td>
                    <td className="px-5 py-4 text-[var(--text-body)]">
                      {c.qty}{c.unit && ` × ${c.unit}`}
                    </td>
                    <td className="px-5 py-4 tnum muted">{c.expiry}</td>
                    <td className={`px-5 py-4 font-semibold tnum ${DAYS_COLOR[c.expiryStatus]}`}>{daysLabel(c.days)}</td>
                    <td className="px-5 py-4">
                      <Badge tone={STATUS_TONE[c.expiryStatus]}>{c.days < 0 ? 'Expired' : c.expiryStatus}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
