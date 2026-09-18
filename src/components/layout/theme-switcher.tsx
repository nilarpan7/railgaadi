'use client';

import { Sun, Moon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useThemeStore } from '@/store/theme';
import { useMounted } from '@/hooks/useMounted';
import { SPRING } from '@/lib/motion';

export function ThemeSwitcher() {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const mounted = useMounted();

  const isLight = resolvedTheme === 'light';

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      disabled={!mounted}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      transition={SPRING.snappy}
      className="group relative grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-border/70 bg-surface/60 text-text-secondary transition-colors hover:border-accent/40 hover:text-accent disabled:opacity-50"
      aria-label={
        mounted
          ? `Switch to ${isLight ? 'dark' : 'light'} mode`
          : 'Toggle theme'
      }
    >
      {/* hover glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full bg-accent/0 transition-colors duration-300 group-hover:bg-accent/10"
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={mounted ? resolvedTheme : 'placeholder'}
          initial={{ rotate: -120, opacity: 0, scale: 0.4 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 120, opacity: 0, scale: 0.4 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="relative grid place-items-center"
        >
          {isLight ? (
            <Moon className="h-[18px] w-[18px]" strokeWidth={2} />
          ) : (
            <Sun className="h-[18px] w-[18px]" strokeWidth={2} />
          )}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
