import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Boxes, Wrench, CalendarDays, TrendingDown,
  Clock, TriangleAlert, Bell, ShieldCheck, Settings, LogOut, FlaskConical, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ROLE_LABEL, useLabData } from '../lib/labStore';
import { summarize } from '../lib/summary';

interface NavItem {
  to: string;
  label: string;
  /** Shorter label for the narrow mobile drawer. */
  short?: string;
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
      { to: '/low-stock', label: 'Low Stock Alerts', short: 'Low Stock', icon: TrendingDown, badge: { count: 0, tone: 'orange' } },
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

export default function Sidebar({
  open,
  onClose,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}) {
  const { inventory, equipment, email, role, canEdit } = useLabData();
  const name = email ?? 'Dr. Admin';
  const lowCount = summarize(inventory, equipment).lowStock.length;
  const badgeFor = (item: NavItem) => (item.to === '/low-stock' ? { ...item.badge!, count: lowCount } : item.badge);

  return (
    <>
      {/* Backdrop for the mobile drawer */}
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-[#0b0a22]/60 backdrop-blur-sm transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[200px] shrink-0 flex-col border-r border-[var(--rail-border)] bg-[var(--rail)] text-[var(--rail-item)] shadow-2xl transition-transform duration-300 lg:static lg:z-auto lg:w-[264px] lg:translate-x-0 lg:shadow-none ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4 lg:gap-3 lg:px-5 lg:py-6">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full lg:h-10 lg:w-10 bg-gradient-to-br from-primary-400 to-primary-700 text-white shadow-lg shadow-primary-600/40">
          <FlaskConical size={19} />
        </span>
        <div className="leading-tight">
          <div className="display text-[15px] font-extrabold text-white lg:text-[17px]">LabPilot</div>
          <div className="whitespace-nowrap text-[11px] text-primary-300 lg:text-xs">Lab Management</div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-full text-[var(--rail-item)] transition-colors hover:bg-[var(--rail-item-hover)] hover:text-white lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="rail-scroll flex-1 overflow-y-auto px-2 pb-4 lg:px-3">
        {SECTIONS.map((section) => (
          <div key={section.title} className="mb-1 mt-4 first:mt-1">
            <div className="display px-3 pb-1.5 text-[10px] lg:px-4 lg:pb-2 lg:text-[11px] font-bold tracking-widest text-[var(--rail-section)]">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.filter((item) => canEdit || item.to !== '/admin').map((item) => {
                const badge = badgeFor(item);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-full px-3 py-2 text-[13px] font-medium transition-colors lg:gap-3 lg:px-4 lg:py-2.5 lg:text-sm ${
                        isActive
                          ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-600/30'
                          : 'text-[var(--rail-item)] hover:bg-[var(--rail-item-hover)] hover:text-white'
                      }`
                    }
                  >
                    <item.icon size={18} className="shrink-0" />
                    <span className="min-w-0 flex-1 truncate">
                      {item.short ? (
                        <>
                          <span className="lg:hidden">{item.short}</span>
                          <span className="hidden lg:inline">{item.label}</span>
                        </>
                      ) : (
                        item.label
                      )}
                    </span>
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
      <div className="border-t border-white/10 p-2 lg:p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-ember text-sm font-semibold text-white">
            {name[0].toUpperCase()}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-semibold text-white" title={name}>{name}</div>
            <div className="text-xs text-[var(--rail-section)]">{ROLE_LABEL[role]}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="mt-1 flex w-full items-center gap-2.5 rounded-full px-3 py-2 text-[13px] font-medium lg:gap-3 lg:px-4 lg:py-2.5 lg:text-sm text-[var(--rail-item)] transition-colors hover:bg-[var(--rail-item-hover)] hover:text-white"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
    </>
  );
}
