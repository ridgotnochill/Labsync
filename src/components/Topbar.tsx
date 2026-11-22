import { Bell, Sun, Moon, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../theme';
import QuickSearch from './QuickSearch';

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

export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? 'Dashboard';
  const [theme, toggleTheme] = useTheme();
  const dark = theme === 'dark';

  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)]/85 px-3 py-3 backdrop-blur-md sm:gap-4 sm:px-6 sm:py-3.5">
      <button
        onClick={onMenu}
        aria-label="Open menu"
        className="muted grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors hover:bg-[var(--surface-3)] lg:hidden"
      >
        <Menu size={20} />
      </button>
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <span className="muted hidden sm:inline">LabPilot</span>
        <span className="faint hidden sm:inline">›</span>
        <span className="display truncate font-bold text-[var(--text-strong)]">{title}</span>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <QuickSearch />
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
        <span className="hidden h-9 w-9 place-items-center rounded-full bg-ember text-sm font-semibold text-white sm:grid">
          A
        </span>
      </div>
    </header>
  );
}
