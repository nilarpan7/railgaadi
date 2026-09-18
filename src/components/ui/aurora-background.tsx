'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Slow-drifting colour blobs behind hero sections. Purely decorative —
 * sits under content with `pointer-events-none` and no layout impact.
 */
export function AuroraBackground({
  className,
  intensity = 1,
}: {
  className?: string;
  intensity?: number;
}) {
  const reduce = useReducedMotion();

  const blobs = [
    {
      color: 'var(--aurora-1)',
      size: 'h-[42rem] w-[42rem]',
      pos: 'top-[-18rem] left-[-10rem]',
      duration: 26,
    },
    {
      color: 'var(--aurora-2)',
      size: 'h-[34rem] w-[34rem]',
      pos: 'top-[-8rem] right-[-8rem]',
      duration: 32,
    },
    {
      color: 'var(--aurora-3)',
      size: 'h-[30rem] w-[30rem]',
      pos: 'top-[16rem] left-[35%]',
      duration: 38,
    },
  ];

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className
      )}
      style={{ opacity: intensity }}
    >
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className={cn('absolute rounded-full blur-[100px] will-change-transform transform-gpu', b.size, b.pos)}
          style={{ background: b.color }}
          animate={
            reduce
              ? undefined
              : {
                  x: [0, 40, -30, 0],
                  y: [0, -30, 25, 0],
                  scale: [1, 1.12, 0.94, 1],
                }
          }
          transition={{
            duration: b.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/** Faint graph-paper grid, masked out toward the bottom. */
export function GridPattern({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 grid-pattern', className)}
    />
  );
}

/** Film-grain overlay — kills the "flat CSS gradient" look. */
export function NoiseOverlay({ className }: { className?: string }) {
  return <div aria-hidden className={cn('noise-overlay', className)} />;
}
