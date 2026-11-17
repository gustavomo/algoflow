'use client';

import { useReducedMotion } from 'framer-motion';
import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/** False on the server and during hydration, true on every later render. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

/**
 * framer's `useReducedMotion`, held at false until hydration finishes. The
 * framer hook is null on the server but already true on the first client
 * render, so branching markup (an `initial` prop, a pulse element) on it
 * directly makes the hydrated HTML differ from the server HTML.
 */
export function useHydratedReducedMotion(): boolean {
  const reduced = useReducedMotion();
  return useHydrated() && Boolean(reduced);
}
