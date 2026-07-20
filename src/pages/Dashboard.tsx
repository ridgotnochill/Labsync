import {
  Package, Wrench, TrendingDown, Clock, AlertCircle, CalendarCheck,
  Plus, CalendarPlus, Bell, ArrowRight, PackagePlus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import TrendChart from '../components/TrendChart';
import { Badge } from '../components/ui';

interface Stat {
  icon: LucideIcon;
  iconTone: string;
  value: string;
  label: string;
  sub: string;
  badge?: { text: string; tone: 'orange' | 'red' };
}

const STATS: Stat[] = [
  { icon: Package, iconTone: 'bg-blue-50 text-blue-600', value: '485', label: 'Total Inventory', sub: 'Items tracked' },
  { icon: Wrench, iconTone: 'bg-indigo-50 text-indigo-600', value: '47', label: 'Total Equipment', sub: 'All labs combined' },
  { icon: TrendingDown, iconTone: 'bg-orange-50 text-orange-600', value: '5', label: 'Low Stock Items', sub: 'Need restocking', badge: { text: 'Alert', tone: 'orange' } },
  { icon: Clock, iconTone: 'bg-red-50 text-red-600', value: '3', label: 'Expiring Chemicals', sub: 'Within 90 days', badge: { text: 'Urgent', tone: 'red' } },
  { icon: AlertCircle, iconTone: 'bg-amber-50 text-amber-600', value: '2', label: 'Under Maintenance', sub: 'Equipment units' },
  { icon: CalendarCheck, iconTone: 'bg-emerald-50 text-emerald-600', value: '4', label: "Today's Schedule", sub: 'Lab sessions' },
];

const ACTIONS: { icon: LucideIcon; label: string; tone: string }[] = [
  { icon: PackagePlus, label: 'Add Inventory Item', tone: 'bg-blue-50 text-blue-600' },
  { icon: Plus, label: 'Add Equipment', tone: 'bg-indigo-50 text-indigo-600' },
  { icon: CalendarPlus, label: 'Schedule Lab', tone: 'bg-amber-50 text-amber-600' },
  { icon: Bell, label: 'View Notifications', tone: 'bg-emerald-50 text-emerald-600' },
];

const ACTIVITY = [
  { color: 'bg-orange-500', text: 'Hydrochloric Acid restocked request sent', time: '12 min ago' },
  { color: 'bg-emerald-500', text: 'Analytical Balance calibration marked complete', time: '1 hour ago' },
  { color: 'bg-blue-500', text: 'BSc Chemistry Practical scheduled in Lab A', time: '3 hours ago' },
  { color: 'bg-red-500', text: 'Damage report filed for Glass Thermometer', time: 'Yesterday' },
];

export default function Dashboard() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          Good Morning, Dr. Admin <span className="text-2xl">👋</span>
        </h1>
        <p className="mt-1 text-sm muted">
          Here is what's happening across your laboratories — Monday, 01 July 2024
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STATS.map((s) => (
          <div key={s.label} className="card p-5 transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${s.iconTone}`}>
                <s.icon size={20} />
              </span>
              {s.badge && <Badge tone={s.badge.tone}>{s.badge.text}</Badge>}
            </div>
            <div className="mt-4 text-3xl font-bold tnum text-slate-900">{s.value}</div>
            <div className="mt-1 text-sm font-medium text-slate-700">{s.label}</div>
            <div className="text-xs faint">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart + right column */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">Lab Usage &amp; Inventory Trend</h3>
              <p className="text-sm muted">Monthly sessions and inventory count — Jan to Jun 2024</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 muted">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Sessions
              </span>
              <span className="flex items-center gap-1.5 muted">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Items
              </span>
            </div>
          </div>
          <div className="mt-4">
            <TrendChart />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider muted">Quick Actions</h3>
            <div className="mt-3 space-y-2">
              {ACTIONS.map((a) => (
                <button
                  key={a.label}
                  className="group flex w-full items-center gap-3 rounded-xl border border-[var(--border)] px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
                >
                  <span className={`grid h-8 w-8 place-items-center rounded-lg ${a.tone}`}>
                    <a.icon size={16} />
                  </span>
                  <span className="flex-1 text-sm font-medium text-slate-700">{a.label}</span>
                  <ArrowRight size={16} className="text-slate-300 transition-colors group-hover:text-slate-500" />
                </button>
              ))}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-[var(--border)] px-5 py-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider muted">Active Alerts</h3>
            </div>
            <div className="flex items-center gap-3 bg-orange-50/60 px-5 py-3.5">
              <TrendingDown size={18} className="text-orange-500" />
              <span className="text-sm font-medium text-orange-700">5 items below minimum stock</span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {ACTIVITY.map((a, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${a.color}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700">{a.text}</p>
                    <p className="text-xs faint">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
