import { useState, useEffect, useCallback } from 'react';

export type SpectatorTheme = 'dark' | 'light';

const STORAGE_KEY = 'ds-public-theme';
const THEME_EVENT = 'ds-theme-change';

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

function applyThemeToDocument(theme: SpectatorTheme) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

export function useSpectatorTheme() {
  const [theme, setTheme] = useState<SpectatorTheme>(() => {
    const initial = readInitialTheme();
    applyThemeToDocument(initial);
    return initial;
  });

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: SpectatorTheme = prev === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Ignore storage errors
      }
      applyThemeToDocument(next);
      window.dispatchEvent(new CustomEvent<SpectatorTheme>(THEME_EVENT, { detail: next }));
      return next;
    });
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'dark' || e.newValue === 'light')) {
        setTheme(e.newValue);
      }
    };
    const handleCustom = (e: Event) => {
      const detail = (e as CustomEvent<SpectatorTheme>).detail;
      if (detail === 'dark' || detail === 'light') {
        setTheme(detail);
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener(THEME_EVENT, handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(THEME_EVENT, handleCustom);
    };
  }, []);

  return { theme, toggleTheme };
}
