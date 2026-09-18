'use client';

import { useEffect, useRef } from 'react';
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  /** Springs the number up once the element scrolls into view. */
  animateOnView?: boolean;
  stiffness?: number;
  damping?: number;
}

/**
 * Counts up to `value`. Writes through a MotionValue rather than React state,
 * so it never triggers a re-render per frame.
 */
export function AnimatedCounter({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
  animateOnView = true,
  stiffness = 70,
  damping = 22,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduce = useReducedMotion();

  const raw = useMotionValue(0);
  const spring = useSpring(raw, { stiffness, damping });
  const text = useTransform(spring, (v) =>
    v.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );

  useEffect(() => {
    if (reduce) {
      raw.jump(value);
      return;
    }
    if (!animateOnView || inView) raw.set(value);
  }, [inView, value, raw, animateOnView, reduce]);

  return (
    <span ref={ref} className={cn('tabular', className)}>
      {prefix}
      <motion.span>{text}</motion.span>
      {suffix}
    </span>
  );
}
