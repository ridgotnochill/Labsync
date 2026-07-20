import { Download } from 'lucide-react';
import { chemicals } from '../data';
import type { ExpiryStatus } from '../data';
import { Badge, BtnGhost, PageHeader } from '../components/ui';
import type { Tone } from '../components/ui';

const STATUS_TONE: Record<ExpiryStatus, Tone> = {
  Critical: 'red',
  Warning: 'amber',
  Safe: 'green',
};
const DAYS_COLOR: Record<ExpiryStatus, string> = {
  Critical: 'text-red-600',
  Warning: 'text-amber-600',
  Safe: 'text-emerald-600',
};

const SUMMARY: { label: string; status: ExpiryStatus; dot: string; ring: string }[] = [
  { label: 'Critical (≤ 14 days)', status: 'Critical', dot: 'bg-red-500', ring: 'border-red-200 bg-red-50/50' },
  { label: 'Warning (15–60 days)', status: 'Warning', dot: 'bg-amber-500', ring: 'border-amber-200 bg-amber-50/50' },
  { label: 'Safe (> 60 days)', status: 'Safe', dot: 'bg-emerald-500', ring: 'border-emerald-200 bg-emerald-50/50' },
];

export default function ChemicalExpiry() {
  const count = (s: ExpiryStatus) => chemicals.filter((c) => c.status === s).length;

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
            <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} /> {s.label}
            </span>
            <span className="text-2xl font-bold tnum text-slate-900">{count(s.status)}</span>
          </div>
        ))}
      </div>

      <div className="card mt-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3.5">Chemical Name</th>
                <th className="px-5 py-3.5">Batch Number</th>
                <th className="px-5 py-3.5">Quantity</th>
                <th className="px-5 py-3.5">Expiry Date</th>
                <th className="px-5 py-3.5">Days Remaining</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {chemicals.map((c) => (
                <tr key={c.batch} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-5 py-4 font-semibold text-slate-900">{c.name}</td>
                  <td className="px-5 py-4 tnum muted">{c.batch}</td>
                  <td className="px-5 py-4 text-slate-700">{c.quantity}</td>
                  <td className="px-5 py-4 tnum muted">{c.expiry}</td>
                  <td className={`px-5 py-4 font-semibold tnum ${DAYS_COLOR[c.status]}`}>{c.daysRemaining} days</td>
                  <td className="px-5 py-4"><Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
