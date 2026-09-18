import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * `true` after hydration, `false` during SSR and the first client render.
 *
 * Uses `useSyncExternalStore` rather than `useState` + `useEffect` so it
 * doesn't schedule a cascading render (and doesn't trip
 * `react-hooks/set-state-in-effect`).
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
