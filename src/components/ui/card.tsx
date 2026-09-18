'use client';

import { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

/* ============================================================
   Card — the base surface
   ============================================================ */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Hairline ring + hover lift + top sheen. */
  premium?: boolean;
  /** Frosted translucent surface instead of solid. */
  glass?: boolean;
  /** Animated conic-gradient border on hover. */
  gradientBorder?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
} as const;

export function Card({
  premium = true,
  glass = false,
  gradientBorder = false,
  padding = 'md',
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        premium && !glass && 'card-premium',
        glass && 'glass-card rounded-[22px]',
        !premium && !glass && 'rounded-[22px] border border-border bg-surface',
        gradientBorder && 'gradient-border',
        PADDING[padding],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ============================================================
   SpotlightCard — radial glow tracks the cursor
   ============================================================ */
export function SpotlightCard({
  className,
  children,
  padding = 'md',
  glowColor = 'var(--accent-glow)',
}: {
  className?: string;
  children: React.ReactNode;
  padding?: keyof typeof PADDING;
  glowColor?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--spotlight-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--spotlight-y', `${e.clientY - rect.top}px`);
  }, []);

  const onMouseEnter = useCallback(() => {
    ref.current?.style.setProperty('--spotlight-opacity', '1');
  }, []);

  const onMouseLeave = useCallback(() => {
    ref.current?.style.setProperty('--spotlight-opacity', '0');
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn('card-premium group relative', PADDING[padding], className)}
      style={{
        ['--spotlight-x' as string]: '0px',
        ['--spotlight-y' as string]: '0px',
        ['--spotlight-opacity' as string]: '0',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 rounded-[inherit]"
        style={{
          opacity: 'var(--spotlight-opacity, 0)',
          background: `radial-gradient(340px circle at var(--spotlight-x, 0px) var(--spotlight-y, 0px), ${glowColor}, transparent 68%)`,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/* ============================================================
   TiltCard — subtle 3D rotation toward the cursor
   ============================================================ */
export function TiltCard({
  className,
  children,
  intensity = 9,
}: {
  className?: string;
  children: React.ReactNode;
  intensity?: number;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [intensity, -intensity]), {
    stiffness: 200,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-intensity, intensity]), {
    stiffness: 200,
    damping: 22,
  });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="perspective-1000">
      <motion.div
        onMouseMove={onMove}
        onMouseLeave={reset}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className={cn('will-change-transform', className)}
      >
        {children}
      </motion.div>
    </div>
  );
}
