import { cn } from '@/lib/utils';

type Tone =
  | 'accent'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'outline';

const TONES: Record<Tone, string> = {
  accent: 'bg-accent-light text-accent border-accent/25',
  neutral: 'bg-surface-alt text-text-secondary border-border',
  success: 'bg-success-light text-success border-success/25',
  warning: 'bg-warning-light text-warning border-warning/25',
  error: 'bg-error-light text-error border-error/25',
  info: 'bg-info-light text-info border-info/25',
  outline: 'bg-transparent text-text-secondary border-border-strong',
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
}

const SIZES = {
  xs: 'text-[10px] px-2 py-0.5 gap-1',
  sm: 'text-[11px] px-2.5 py-0.5 gap-1.5',
  md: 'text-xs px-3 py-1 gap-1.5',
} as const;

export function Badge({
  tone = 'neutral',
  size = 'sm',
  dot = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-bold uppercase tracking-wider whitespace-nowrap',
        TONES[tone],
        SIZES[size],
        className
      )}
      {...rest}
    >
      {dot && <span className="live-dot" aria-hidden />}
      {children}
    </span>
  );
}

/** Small pill used above section headings. */
export function Eyebrow({
  className,
  children,
  icon,
}: {
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5',
        'text-[11px] font-bold uppercase tracking-[0.14em] text-text-secondary backdrop-blur-sm',
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
