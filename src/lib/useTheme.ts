import { useEffect, useState } from 'react';

/** Persists a light/dark theme to localStorage and toggles the `dark` class. */
export function useTheme(): { isDark: boolean; toggle: () => void } {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem('theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch {
      /* Theme still works when browser storage is unavailable. */
    }
  }, [isDark]);

  return { isDark, toggle: () => setIsDark((v) => !v) };
}
