import type { Transition, Variants } from 'framer-motion';

/* ============================================================
   Shared easing curves
   ============================================================ */
export const EASE = {
  /** Fast out, long settle — the house curve for entrances. */
  outExpo: [0.16, 1, 0.3, 1],
  /** Gentle overshoot for badges, pills, icons. */
  spring: [0.34, 1.56, 0.64, 1],
  /** Symmetric, for colour/opacity crossfades. */
  inOut: [0.4, 0, 0.2, 1],
} as const;

export const SPRING = {
  /** Snappy — buttons, toggles, marker moves. */
  snappy: { type: 'spring', stiffness: 420, damping: 32, mass: 0.7 },
  /** Soft — panels, drawers, cards. */
  soft: { type: 'spring', stiffness: 190, damping: 26 },
  /** Loose — parallax followers, cursor glows. */
  loose: { type: 'spring', stiffness: 90, damping: 20 },
} satisfies Record<string, Transition>;

/* ============================================================
   Entrance variants
   ============================================================ */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: EASE.inOut } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE.outExpo } },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE.outExpo } },
};

export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: 30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: EASE.outExpo } },
};

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: -30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: EASE.outExpo } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE.outExpo } },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: EASE.spring } },
};

/** Blur-up reveal — reads as "expensive" on headlines and hero imagery. */
export const blurUp: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.85, ease: EASE.outExpo },
  },
};

/* ============================================================
   Orchestration
   ============================================================ */
export function stagger(children = 0.08, delay = 0): Variants {
  return {
    hidden: {},
    show: {
      transition: { staggerChildren: children, delayChildren: delay },
    },
  };
}

/** Default container for grids and lists. */
export const staggerContainer = stagger(0.08);

/** Tighter cascade for dense rows (timelines, tables). */
export const staggerTight = stagger(0.04);

/* ============================================================
   Interaction presets
   ============================================================ */
export const hoverLift = {
  whileHover: { y: -5, transition: { duration: 0.3, ease: EASE.outExpo } },
  whileTap: { y: -1, scale: 0.99 },
} as const;

export const hoverPress = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.97 },
  transition: SPRING.snappy,
} as const;

/* ============================================================
   Viewport defaults for scroll-triggered reveals
   ============================================================ */
export const viewportOnce = { once: true, amount: 0.25 } as const;
export const viewportEager = { once: true, amount: 0.05 } as const;

/* ============================================================
   Word-by-word headline splitter
   ============================================================ */
export const wordContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.05 } },
};

export const wordChild: Variants = {
  hidden: { opacity: 0, y: '58%', rotateX: -55 },
  show: {
    opacity: 1,
    y: '0%',
    rotateX: 0,
    transition: { duration: 0.85, ease: EASE.outExpo },
  },
};
