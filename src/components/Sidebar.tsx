import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Boxes, Wrench, CalendarDays, TrendingDown,
  Clock, TriangleAlert, Bell, ShieldCheck, Settings, LogOut, FlaskConical,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLabData } from '../lib/labStore';
import { summarize } from '../lib/summary';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: { count: number; tone: 'orange' | 'red' };
}

const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Laboratory',
    items: [
      { to: '/inventory', label: 'Inventory', icon: Boxes },
      { to: '/equipment', label: 'Equipment', icon: Wrench },
      { to: '/schedule', label: 'Lab Schedule', icon: CalendarDays },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      { to: '/low-stock', label: 'Low Stock Alerts', icon: TrendingDown, badge: { count: 0, tone: 'orange' } },
      { to: '/chemical-expiry', label: 'Chemical Expiry', icon: Clock },
      { to: '/damage-reports', label: 'Damage Reports', icon: TriangleAlert },
    ],
  },
  {
    title: 'Administration',
    items: [
      { to: '/notifications', label: 'Notifications', icon: Bell, badge: { count: 3, tone: 'red' } },
      { to: '/admin', label: 'Admin Panel', icon: ShieldCheck },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function Sidebar({ onLogout }: { onLogout: () => void }) {
  const { inventory, equipment } = useLabData();
  const lowCount = summarize(inventory, equipment).lowStock.length;
  const badgeFor = (item: NavItem) => (item.to === '/low-stock' ? { ...item.badge!, count: lowCount } : item.badge);

  return (
    <aside className="flex h-screen w-[264px] shrink-0 flex-col border-r border-[var(--rail-border)] bg-[var(--rail)] text-[var(--rail-item)]">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary-400 to-primary-700 text-white shadow-lg shadow-primary-600/40">
          <FlaskConical size={19} />
        </span>
        <div className="leading-tight">
          <div className="display text-[17px] font-extrabold text-white">LabSync</div>
          <div className="text-xs text-primary-300">Lab Management</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="rail-scroll flex-1 overflow-y-auto px-3 pb-4">
        {SECTIONS.map((section) => (
          <div key={section.title} className="mb-1 mt-4 first:mt-1">
            <div className="display px-4 pb-2 text-[11px] font-bold tracking-widest text-[var(--rail-section)]">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const badge = badgeFor(item);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-600/30'
                          : 'text-[var(--rail-item)] hover:bg-[var(--rail-item-hover)] hover:text-white'
                      }`
                    }
                  >
                    <item.icon size={18} className="shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {badge && badge.count > 0 && (
                      <span
                        className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-semibold text-white ${
                          badge.tone === 'red' ? 'bg-red-500' : 'bg-orange-500'
                        }`}
                      >
                        {badge.count}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-ember text-sm font-semibold text-white">
            A
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-semibold text-white">Dr. Admin</div>
            <div className="text-xs text-[var(--rail-section)]">Administrator</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-[var(--rail-item)] transition-colors hover:bg-[var(--rail-item-hover)] hover:text-white"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
