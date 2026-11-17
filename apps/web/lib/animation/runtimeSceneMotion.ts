import type { Transition } from 'framer-motion';

export const INSTANT: Transition = { duration: 0 };
export const MOVE: Transition = { type: 'spring', stiffness: 240, damping: 26 };

/**
 * Exit variant for a runtime-scene token. framer-motion calls variant
 * functions with `props.custom` while diffing animation types, and with
 * AnimatePresence's `custom` only when the exit actually runs, so the value
 * may be undefined or stale: never assume it is a Set.
 *
 * A token that still exists in the current step moved to another region:
 * hide it instantly so its layoutId twin flies from this spot. A token that
 * no longer exists was popped: shrink it away.
 */
export function tokenExitVariant(tokenId: string, reduced: boolean) {
  return (currentIds?: unknown) =>
    reduced || (currentIds instanceof Set && currentIds.has(tokenId))
      ? { opacity: 0, transition: INSTANT }
      : { opacity: 0, scale: 0.6, transition: { duration: 0.22 } };
}
