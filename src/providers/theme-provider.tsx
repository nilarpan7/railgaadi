'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store/theme';

/**
 * Keeps `<html>` in sync with the theme store.
 *
 * First paint is handled by the inline bootstrap script in the root layout;
 * this only reconciles after hydration and watches for OS-level changes.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Re-apply once so the DOM matches the (possibly rehydrated) store.
    const { theme, setTheme } = useThemeStore.getState();
    setTheme(theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    // `syncWithSystem` no-ops unless the stated preference is 'system'.
    const handler = () => useThemeStore.getState().syncWithSystem();

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return <>{children}</>;
}
