import { useCallback, useSyncExternalStore } from 'react';

/** One `MediaQueryList` per distinct query string — the set is fixed at build time. */
const mediaCache = new Map<string, MediaQueryList>();

function getMedia(query: string): MediaQueryList | null {
  if (typeof window === 'undefined' || !window.matchMedia) return null;
  let media = mediaCache.get(query);
  if (!media) {
    media = window.matchMedia(query);
    mediaCache.set(query, media);
  }
  return media;
}

const getServerSnapshot = () => false;

/**
 * Hook to detect if a media query matches.
 *
 * Backed by `useSyncExternalStore` so the first client render already has the
 * correct value (no post-hydration state flip) and there is no `setState`
 * inside an effect.
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDesktop = useMediaQuery('(min-width: 1024px)');
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const media = getMedia(query);
      if (!media) return () => {};
      media.addEventListener('change', onStoreChange);
      return () => media.removeEventListener('change', onStoreChange);
    },
    [query]
  );

  const getSnapshot = useCallback(
    () => getMedia(query)?.matches ?? false,
    [query]
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Convenience hooks for common breakpoints
 */
export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)');
}

export function useIsTablet() {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)');
}

/** Respects the OS "reduce motion" setting. */
export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
