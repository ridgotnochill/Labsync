import {
  Package, Wrench, TrendingDown, Clock, AlertCircle, CalendarCheck,
  Plus, CalendarPlus, Bell, ArrowRight, ArrowUpRight, PackagePlus, FlaskConical, ShieldCheck, Upload, FileUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import TrendChart from '../components/TrendChart';
import { useState } from 'react';
import { Badge, BtnPrimary } from '../components/ui';
import UploadModal from '../components/UploadModal';
import { useLabData } from '../lib/labStore';
import { summarize } from '../lib/summary';

interface Stat {
  icon: LucideIcon;
  iconTone: string;
  value: string;
  label: string;
  sub: string;
  badge?: { text: string; tone: 'orange' | 'red' };
}

const ACTIONS: { icon: LucideIcon; label: string; tone: string; upload?: true }[] = [
  { icon: Upload, label: 'Upload Stock Update', tone: 'bg-zest text-[#15133d]', upload: true },
  { icon: PackagePlus, label: 'Add Inventory Item', tone: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  { icon: Plus, label: 'Add Equipment', tone: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
  { icon: CalendarPlus, label: 'Schedule Lab', tone: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  { icon: Bell, label: 'View Notifications', tone: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
];

/** "12 min ago" style timestamps for the upload log. */
function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Dashboard() {
  const [uploading, setUploading] = useState(false);
  const { inventory, equipment, uploads } = useLabData();
  const sum = summarize(inventory, equipment);
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

  const stats: Stat[] = [
    { icon: Package, iconTone: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400', value: String(sum.totalItems), label: 'Total Inventory', sub: 'Items tracked' },
    { icon: Wrench, iconTone: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', value: String(sum.totalEquipment), label: 'Total Equipment', sub: 'All labs combined' },
    { icon: TrendingDown, iconTone: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400', value: String(sum.lowStock.length), label: 'Low / Out of Stock', sub: 'Need restocking', ...(sum.lowStock.length > 0 && { badge: { text: 'Alert', tone: 'orange' as const } }) },
    { icon: Clock, iconTone: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400', value: String(sum.expiringSoon), label: 'Expiring Items', sub: 'Within 90 days', ...(sum.expiringSoon > 0 && { badge: { text: 'Urgent', tone: 'red' as const } }) },
    { icon: AlertCircle, iconTone: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400', value: String(sum.underMaintenance), label: 'Under Maintenance', sub: 'Equipment units' },
    { icon: CalendarCheck, iconTone: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', value: '4', label: "Today's Schedule", sub: 'Lab sessions' },
  ];

  const highlights: { icon: LucideIcon; title: string; text: string; tone: string }[] = [
    { icon: Package, title: plural(sum.totalItems, 'item'), text: 'Tracked across all labs', tone: 'bg-white text-[#15133d]' },
    { icon: ShieldCheck, title: `${sum.expiringSoon} expiring`, text: 'Items within 90 days', tone: 'bg-ember text-white' },
    { icon: CalendarCheck, title: '4 sessions', text: "On today's lab schedule", tone: 'bg-zest text-[#15133d]' },
  ];

  return (
    <div>
      {uploading && <UploadModal onClose={() => setUploading(false)} />}
      {/* Hero banner */}
      <section className="hero relative mb-6 overflow-hidden shadow-xl shadow-navy-900/20">
        <FlaskConical
          aria-hidden
          strokeWidth={0.75}
          className="pointer-events-none absolute -right-10 -top-12 h-[340px] w-[340px] text-white/10"
        />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-primary-300/30 blur-3xl" />

        <div className="relative px-7 pt-8 pb-7 sm:px-10 sm:pt-10">
          <p className="text-sm text-white/85">Monday, 01 July 2024</p>
          <h1 className="mt-3 max-w-xl text-4xl leading-[0.95] font-extrabold sm:text-5xl">
            Good morning,
            <br />
            Dr. Admin
          </h1>
          <p className="mt-4 max-w-md text-sm text-white/85">
            Here is what's happening across your laboratories today.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <BtnPrimary color="zest">
              Schedule Lab <Plus size={14} />
            </BtnPrimary>
            <button className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#15133d] transition-colors hover:bg-white/90">
              View Alerts <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* Feature strip */}
        <div className="relative grid grid-cols-1 gap-px border-t border-white/10 bg-white/10 sm:grid-cols-3">
          {highlights.map((h) => (
            <div key={h.title} className="flex items-start gap-3 bg-[#14133a]/55 px-7 py-5 backdrop-blur-sm sm:px-8">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${h.tone}`}>
                <h.icon size={18} />
              </span>
              <div>
                <div className="display text-sm font-bold">{h.title}</div>
                <p className="mt-0.5 text-xs text-white/80">{h.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-5 transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <span className={`grid h-11 w-11 place-items-center rounded-full ${s.iconTone}`}>
                <s.icon size={20} />
              </span>
              {s.badge && <Badge tone={s.badge.tone}>{s.badge.text}</Badge>}
            </div>
            <div className="display mt-4 text-4xl font-extrabold tnum text-[var(--text-strong)]">{s.value}</div>
            <div className="mt-1 text-sm font-medium text-[var(--text-body)]">{s.label}</div>
            <div className="text-xs faint">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart + right column */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="display font-bold text-[var(--text-strong)]">Lab Usage &amp; Inventory Trend</h3>
              <p className="text-sm muted">Monthly sessions and inventory count — Jan to Jun 2024</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 muted">
                <span className="h-2.5 w-2.5 rounded-full bg-primary-500" /> Sessions
              </span>
              <span className="flex items-center gap-1.5 muted">
                <span className="h-2.5 w-2.5 rounded-full bg-ember" /> Items
              </span>
            </div>
          </div>
          <div className="mt-4">
            <TrendChart />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="display text-xs font-bold tracking-widest muted">Quick Actions</h3>
            <div className="mt-3 space-y-2">
              {ACTIONS.map((a) => (
                <button
                  key={a.label}
                  onClick={a.upload ? () => setUploading(true) : undefined}
                  className="group flex w-full items-center gap-3 rounded-full border border-[var(--border)] px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-2)]"
                >
                  <span className={`grid h-8 w-8 place-items-center rounded-full ${a.tone}`}>
                    <a.icon size={16} />
                  </span>
                  <span className="flex-1 text-sm font-medium text-[var(--text-body)]">{a.label}</span>
                  <ArrowRight size={16} className="text-[var(--text-faint)] transition-colors group-hover:text-[var(--text-muted)]" />
                </button>
              ))}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-[var(--border)] px-5 py-3">
              <h3 className="display text-xs font-bold tracking-widest muted">Alerts &amp; Recent Uploads</h3>
            </div>
            {sum.lowStock.length > 0 && (
              <div className="flex items-center gap-3 bg-orange-50/60 dark:bg-orange-500/10 px-5 py-3.5">
                <TrendingDown size={18} className="text-orange-500" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
                  {plural(sum.lowStock.length, 'item')} low or out of stock
                </span>
              </div>
            )}
            {uploads.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm muted">No uploads yet — use “Upload Stock Update” above.</p>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {uploads.slice(0, 5).map((u) => (
                  <div key={u.at} className="flex items-start gap-3 px-5 py-3">
                    <FileUp size={16} className="mt-0.5 shrink-0 text-primary-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-[var(--text-body)]" title={u.fileName}>{u.fileName}</p>
                      <p className="text-xs faint">
                        {u.added} added · {u.updated} updated · {timeAgo(u.at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
