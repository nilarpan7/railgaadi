'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { fadeUp, viewportOnce } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Which entrance variant to use. Defaults to `fadeUp`. */
  variants?: Variants;
  delay?: number;
  /** Fraction of the element that must be visible before animating. */
  amount?: number;
  as?: 'div' | 'section' | 'li' | 'span' | 'header' | 'article';
}

/**
 * Scroll-triggered entrance wrapper. Animates once, respects
 * `prefers-reduced-motion` by rendering the final state immediately.
 */
export function Reveal({
  children,
  className,
  variants = fadeUp,
  delay = 0,
  amount = viewportOnce.amount,
  as = 'div',
}: RevealProps) {
  const reduce = useReducedMotion();
  const Tag = motion[as];

  if (reduce) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Tag
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={variants}
      transition={delay ? { delay } : undefined}
      className={className}
    >
      {children}
    </Tag>
  );
}

/**
 * Parent that cascades its `Reveal`-style children. Children should each
 * declare `variants` (e.g. `fadeUp`) but no `whileInView` of their own.
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
  delay = 0,
  amount = 0.15,
  as = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  amount?: number;
  as?: 'div' | 'section' | 'ul' | 'ol';
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];

  if (reduce) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Tag
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      className={className}
    >
      {children}
    </Tag>
  );
}

/** A child of `RevealGroup`. */
export function RevealItem({
  children,
  className,
  variants = fadeUp,
  as = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
  as?: 'div' | 'li' | 'span' | 'article';
}) {
  const Tag = motion[as];
  return (
    <Tag variants={variants} className={cn(className)}>
      {children}
    </Tag>
  );
}
