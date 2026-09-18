'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Train, BarChart3, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SPRING } from '@/lib/motion';

const ITEMS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Track', href: '/tracking', icon: Train },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Saved', href: '/favorites', icon: Heart },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="glass-nav fixed bottom-0 left-0 right-0 z-50 border-t border-border/70 md:hidden pl-safe pr-safe">
      <div className="flex h-16 items-center justify-around px-2 pb-safe">
        {ITEMS.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className="group relative flex flex-1 flex-col items-center justify-center py-2"
            >
              {isActive && (
                <motion.span
                  layoutId="bottomNavPill"
                  transition={SPRING.soft}
                  className="absolute inset-x-3 inset-y-1 rounded-2xl bg-accent-light"
                />
              )}
              <motion.span
                whileTap={{ scale: 0.86 }}
                transition={SPRING.snappy}
                className="relative"
              >
                <Icon
                  className={cn(
                    'h-5 w-5 transition-colors duration-200',
                    isActive
                      ? 'text-accent'
                      : 'text-text-muted group-hover:text-text-secondary'
                  )}
                  strokeWidth={isActive ? 2.4 : 2}
                />
              </motion.span>
              <span
                className={cn(
                  'relative mt-1 text-[10px] font-semibold transition-colors duration-200',
                  isActive
                    ? 'text-accent'
                    : 'text-text-muted group-hover:text-text-secondary'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
