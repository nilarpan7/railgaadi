'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SPRING } from '@/lib/motion';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'glass';
type Size = 'sm' | 'md' | 'lg' | 'xl' | 'icon';

const VARIANTS: Record<Variant, string> = {
  primary:
    'accent-gradient text-white shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/35 border border-white/10',
  secondary:
    'bg-text-primary text-background hover:bg-text-primary/90 shadow-md',
  outline:
    'bg-transparent text-text-primary border border-border-strong hover:border-accent hover:text-accent',
  ghost:
    'bg-transparent text-text-secondary hover:bg-surface-alt hover:text-text-primary',
  danger: 'bg-error text-white hover:brightness-110 shadow-md',
  glass:
    'glass-card text-text-primary hover:border-accent/40 shadow-sm hover:shadow-md',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-sm gap-2 rounded-xl',
  xl: 'h-14 px-8 text-base gap-2.5 rounded-2xl',
  icon: 'h-10 w-10 max-sm:h-11 max-sm:w-11 rounded-xl',
};

const BASE =
  'relative inline-flex items-center justify-center font-semibold tracking-tight select-none whitespace-nowrap ' +
  'transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none ' +
  'max-sm:min-h-[44px] max-sm:min-w-[44px] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  /** Adds the animated diagonal light sweep on hover. */
  shine?: boolean;
  className?: string;
}

export interface ButtonProps
  extends CommonProps,
    Omit<HTMLMotionProps<'button'>, 'children' | 'ref'> {
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = 'primary', size = 'md', shine = false, className, children, ...rest },
    ref
  ) {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.025 }}
        whileTap={{ scale: 0.975 }}
        transition={SPRING.snappy}
        className={cn(BASE, VARIANTS[variant], SIZES[size], shine && 'shine', className)}
        {...rest}
      >
        {children}
      </motion.button>
    );
  }
);

export interface ButtonLinkProps extends CommonProps {
  href: string;
  children?: React.ReactNode;
  target?: string;
  rel?: string;
  onClick?: () => void;
  prefetch?: boolean;
  'aria-label'?: string;
}

/** Same visual language as `Button`, but renders a real `next/link`. */
export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  shine = false,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  const isExternal = /^https?:\/\//.test(href);
  const classes = cn(
    BASE,
    VARIANTS[variant],
    SIZES[size],
    shine && 'shine',
    'hover:-translate-y-0.5 active:translate-y-0 transition-transform',
    className
  );

  if (isExternal) {
    return (
      <a
        href={href}
        className={classes}
        target="_blank"
        rel="noopener noreferrer"
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}
