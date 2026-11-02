import { Search, Bell, Sun, Moon } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../theme';

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
  const [theme, toggleTheme] = useTheme();
  const dark = theme === 'dark';

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-[var(--border)] bg-[var(--surface)]/85 px-6 py-3.5 backdrop-blur-md">
      <div className="flex items-center gap-2 text-sm">
        <span className="muted">Mithibai College</span>
        <span className="faint">›</span>
        <span className="display font-bold text-[var(--text-strong)]">{title}</span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search size={16} className="faint absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            placeholder="Quick search..."
            className="w-64 rounded-full border border-[var(--border)] bg-[var(--bg)] py-2 pl-9 pr-3 text-sm text-[var(--text-body)] placeholder:text-[var(--text-faint)] focus:border-primary-500 focus:bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={dark}
          aria-label="Dark mode"
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggleTheme}
          className={`relative h-7 w-[52px] shrink-0 rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
            dark ? 'border-primary-600 bg-primary-600' : 'border-[var(--border-strong)] bg-[var(--surface-3)]'
          }`}
        >
          <span
            className={`absolute top-1/2 left-0.5 grid h-[22px] w-[22px] -translate-y-1/2 place-items-center rounded-full bg-white shadow-sm transition-transform ${
              dark ? 'translate-x-6 text-primary-600' : 'translate-x-0 text-amber-500'
            }`}
          >
            {dark ? <Moon size={13} /> : <Sun size={13} />}
          </span>
        </button>
        <button className="muted relative grid h-9 w-9 place-items-center rounded-full border border-[var(--border)] transition-colors hover:bg-[var(--surface-3)]">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-ember ring-2 ring-[var(--surface)]" />
        </button>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-ember text-sm font-semibold text-white">
          A
        </span>
      </div>
    </header>
  );
}
