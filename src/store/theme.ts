import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeState {
  /** The user's stated preference — may be `'system'`. */
  theme: Theme;
  /** What is actually painted right now. Never `'system'`. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  /**
   * Flips between light and dark. Unlike a naive toggle this keeps the
   * `'system'` preference intact when the flip lands back on whatever the
   * OS is currently reporting.
   */
  toggleTheme: () => void;
  /** Re-resolve after an OS-level colour-scheme change. */
  syncWithSystem: () => void;
}

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === 'system' ? getSystemTheme() : theme;
}

function applyTheme(resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.classList.toggle('light', resolved === 'light');
  root.style.colorScheme = resolved;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      // Matches the inline bootstrap script in the root layout, which also
      // defaults to dark before hydration.
      resolvedTheme: 'dark',

      setTheme: (theme) => {
        const resolvedTheme = resolveTheme(theme);
        applyTheme(resolvedTheme);
        set({ theme, resolvedTheme });
      },

      toggleTheme: () => {
        const next: ResolvedTheme =
          get().resolvedTheme === 'light' ? 'dark' : 'light';
        applyTheme(next);
        // Collapse back to 'system' when the target already equals the OS
        // setting, so users don't silently lose automatic switching.
        set({
          theme: next === getSystemTheme() ? 'system' : next,
          resolvedTheme: next,
        });
      },

      syncWithSystem: () => {
        if (get().theme !== 'system') return;
        const resolved = getSystemTheme();
        applyTheme(resolved);
        set({ resolvedTheme: resolved });
      },
    }),
    {
      name: 'railgaadi-theme',
      // resolvedTheme is derived; persisting it would let a stale value
      // fight the bootstrap script.
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const resolved = resolveTheme(state.theme);
        state.resolvedTheme = resolved;
        applyTheme(resolved);
      },
    }
  )
);
