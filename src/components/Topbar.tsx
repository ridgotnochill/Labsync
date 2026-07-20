import { Search, Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/inventory': 'Inventory Management',
  '/equipment': 'Equipment Management',
  '/schedule': 'Lab Schedule',
  '/low-stock': 'Low Stock Alerts',
  '/chemical-expiry': 'Chemical Expiry',
  '/damage-reports': 'Damage Reports',
  '/notifications': 'Notifications',
  '/admin': 'Admin Panel',
  '/settings': 'Settings',
};

export default function Topbar() {
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? 'Dashboard';

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-[var(--border)] bg-[var(--surface)]/85 px-6 py-3.5 backdrop-blur-md">
      <div className="flex items-center gap-2 text-sm">
        <span className="muted">Mithibai College</span>
        <span className="faint">›</span>
        <span className="font-semibold text-slate-900">{title}</span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Quick search..."
            className="w-64 rounded-lg border border-[var(--border)] bg-[var(--bg)] py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <button className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100">
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-600 text-sm font-semibold text-white">
          A
        </span>
      </div>
    </header>
  );
}
