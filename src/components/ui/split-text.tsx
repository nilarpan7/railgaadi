'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { wordChild, wordContainer } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface SplitTextProps {
  text: string;
  className?: string;
  /** Words to render with the gradient treatment, matched case-insensitively. */
  highlight?: string[];
  delay?: number;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

/**
 * Word-by-word 3D flip-up reveal. Each word sits in an `overflow-hidden`
 * sleeve so it appears to rise out of the line above it.
 */
export function SplitText({
  text,
  className,
  highlight = [],
  delay = 0,
  as = 'h1',
}: SplitTextProps) {
  const reduce = useReducedMotion();
  const words = text.split(' ');
  const lower = highlight.map((w) => w.toLowerCase());

  const isHighlighted = (word: string) =>
    lower.includes(word.toLowerCase().replace(/[.,—–]/g, ''));

  if (reduce) {
    const Tag = as;
    return (
      <Tag className={className}>
        {words.map((w, i) => (
          <span key={i} className={isHighlighted(w) ? 'text-gradient' : undefined}>
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </Tag>
    );
  }

  const MotionTag = motion[as];

  return (
    <MotionTag
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      variants={wordContainer}
      transition={{ delayChildren: delay }}
      className={cn('perspective-1000', className)}
      aria-label={text}
    >
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="inline-block overflow-hidden pb-[0.12em] align-bottom"
        >
          <motion.span
            variants={wordChild}
            className={cn(
              'inline-block will-change-transform',
              isHighlighted(word) && 'text-gradient'
            )}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </MotionTag>
  );
}
