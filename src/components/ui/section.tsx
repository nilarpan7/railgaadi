'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { fadeUp, viewportOnce } from '@/lib/motion';
import { Eyebrow } from './badge';

interface SectionHeadingProps {
  eyebrow?: string;
  eyebrowIcon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'left' | 'center';
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  eyebrowIcon,
  title,
  description,
  align = 'center',
  action,
  className,
}: SectionHeadingProps) {
  const centered = align === 'center';

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
      className={cn(
        'flex gap-5',
        centered
          ? 'flex-col items-center text-center'
          : 'flex-col justify-between gap-6 sm:flex-row sm:items-end',
        className
      )}
    >
      <div
        className={cn(
          'flex flex-col gap-4',
          centered ? 'items-center' : 'items-start'
        )}
      >
        {eyebrow && (
          <motion.div variants={fadeUp}>
            <Eyebrow icon={eyebrowIcon}>{eyebrow}</Eyebrow>
          </motion.div>
        )}

        <motion.h2
          variants={fadeUp}
          className={cn(
            'font-display text-3xl font-extrabold leading-[1.08] tracking-tight text-text-primary',
            'sm:text-4xl lg:text-[2.75rem]',
            centered && 'max-w-3xl'
          )}
        >
          {title}
        </motion.h2>

        {description && (
          <motion.p
            variants={fadeUp}
            className={cn(
              'text-[15px] leading-relaxed text-text-secondary',
              centered ? 'max-w-2xl' : 'max-w-xl'
            )}
          >
            {description}
          </motion.p>
        )}
      </div>

      {action && <motion.div variants={fadeUp}>{action}</motion.div>}
    </motion.div>
  );
}

/** Full-bleed section wrapper with consistent vertical rhythm. */
export function Section({
  id,
  className,
  containerClassName,
  children,
}: {
  id?: string;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn('relative py-20 sm:py-28', className)}>
      <div
        className={cn(
          'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8',
          containerClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}
