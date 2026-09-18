'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { LogIn, LogOut, ChevronDown, Train, Heart, BarChart3 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SPRING } from '@/lib/motion';

export function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointer = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  if (status === 'loading') {
    return <div className="skeleton h-9 w-9 rounded-full" />;
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="accent-gradient inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_18px_var(--accent-glow)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
      >
        <LogIn className="h-4 w-4" />
        <span>Sign in</span>
      </Link>
    );
  }

  const user = session.user;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex items-center gap-2 rounded-full border border-border/70 p-1 pr-2 transition-colors hover:border-accent/40 hover:bg-surface-alt"
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name || 'Account'}
            width={28}
            height={28}
            className="h-7 w-7 rounded-full border border-border object-cover"
            unoptimized
          />
        ) : (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-accent-light text-xs font-bold text-accent">
            {user.name?.[0]?.toUpperCase() || 'U'}
          </span>
        )}
        <span className="hidden max-w-[104px] truncate text-xs font-semibold text-text-primary sm:inline">
          {user.name || 'Passenger'}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={SPRING.snappy}
          className="text-text-muted"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={SPRING.soft}
            role="menu"
            className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-border bg-surface py-2 shadow-2xl"
          >
            <div className="border-b border-border/70 px-4 py-3">
              <p className="truncate text-xs font-bold text-text-primary">
                {user.name}
              </p>
              <p className="truncate text-[11px] text-text-muted">
                {user.email}
              </p>
            </div>

            <div className="py-1">
              <Link
                href="/tracking"
                onClick={() => setIsOpen(false)}
                role="menuitem"
                className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-alt hover:text-text-primary"
              >
                <Train className="h-4 w-4 text-text-muted" />
                Track a train
              </Link>
              <Link
                href="/analytics"
                onClick={() => setIsOpen(false)}
                role="menuitem"
                className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-alt hover:text-text-primary"
              >
                <BarChart3 className="h-4 w-4 text-text-muted" />
                Network analytics
              </Link>
              <Link
                href="/favorites"
                onClick={() => setIsOpen(false)}
                role="menuitem"
                className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-alt hover:text-text-primary"
              >
                <Heart className="h-4 w-4 text-text-muted" />
                Saved journeys
              </Link>
            </div>

            <div className="border-t border-border/70 pt-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-error transition-colors hover:bg-error-light"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
