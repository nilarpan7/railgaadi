'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Train, Menu, X } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { UserMenu } from './user-menu';
import { NAV_ITEMS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { SPRING } from '@/lib/motion';

const ThemeSwitcher = dynamic(
  () => import('./theme-switcher').then((m) => m.ThemeSwitcher),
  { ssr: false }
);

const ApiKeyModal = dynamic(
  () => import('./api-key-modal').then((m) => m.ApiKeyModal),
  { ssr: false }
);

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (value) => {
    const next = value > 12;
    if (next !== scrolled) setScrolled(next);
  });

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300',
        scrolled
          ? 'glass-nav border-b border-border/70 shadow-[0_1px_0_0_var(--border)]'
          : 'border-b border-transparent bg-background/40 backdrop-blur-sm'
      )}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            'flex items-center justify-between transition-[height] duration-300',
            scrolled ? 'h-14' : 'h-16'
          )}
        >
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5">
            <motion.span
              whileHover={{ rotate: -8, scale: 1.06 }}
              transition={SPRING.snappy}
              className="accent-gradient grid h-9 w-9 place-items-center rounded-xl text-white shadow-[0_6px_18px_var(--accent-glow)]"
            >
              <Train className="h-[19px] w-[19px]" strokeWidth={2.2} />
            </motion.span>
            <span className="font-display text-[17px] font-extrabold tracking-tight text-text-primary">
              Rail<span className="text-gradient">Gaadi</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-200',
                    active
                      ? 'text-accent'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="navActivePill"
                      transition={SPRING.soft}
                      className="absolute inset-0 rounded-full bg-accent-light"
                    />
                  )}
                  <span className="relative">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="hidden sm:block">
              <ApiKeyModal />
            </div>
            <ThemeSwitcher />
            <UserMenu />

            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="grid h-10 w-10 place-items-center rounded-full border border-border/70 text-text-secondary transition-colors hover:border-accent/40 hover:text-accent md:hidden"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-border/70 bg-background/95 backdrop-blur-xl md:hidden"
          >
            <div className="space-y-1 px-4 py-3">
              {NAV_ITEMS.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * index, duration: 0.24 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'block rounded-xl px-4 py-3 text-sm font-semibold transition-colors',
                      isActive(item.href)
                        ? 'bg-accent-light text-accent'
                        : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary'
                    )}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <div className="pt-2 sm:hidden">
                <ApiKeyModal />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
