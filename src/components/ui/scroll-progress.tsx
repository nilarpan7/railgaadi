'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

/** Thin accent bar pinned under the navbar that tracks page scroll. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 160,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="accent-gradient fixed inset-x-0 top-0 z-[60] h-[2px] origin-left"
    />
  );
}
