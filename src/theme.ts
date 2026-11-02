import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const KEY = 'labsync.theme';

// index.html stamps data-theme before React mounts (no light flash); start from that.
function initialTheme(): Theme {
  const stamped = document.documentElement.dataset.theme;
  if (stamped === 'light' || stamped === 'dark') return stamped;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = () =>
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* storage unavailable — theme still applies for this session */
      }
      return next;
    });

  return [theme, toggle];
}
