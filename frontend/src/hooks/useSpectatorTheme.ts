import { useState, useEffect, useCallback } from 'react';

export type SpectatorTheme = 'dark' | 'light';

const STORAGE_KEY = 'ds-public-theme';

function readInitialTheme(): SpectatorTheme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    // Ignore storage access errors in private browsing
  }
  return 'dark';
}

export function useSpectatorTheme() {
  const [theme, setTheme] = useState<SpectatorTheme>(readInitialTheme);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: SpectatorTheme = prev === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'dark' || e.newValue === 'light')) {
        setTheme(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return { theme, toggleTheme };
}
