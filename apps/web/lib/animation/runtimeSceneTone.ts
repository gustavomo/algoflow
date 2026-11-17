import type {
  RuntimeSceneCellState,
  RuntimeSceneRegionTone,
} from '@algoflow/contracts';

export const TONE_VAR: Record<RuntimeSceneRegionTone, string> = {
  green: '--color-success',
  red: '--color-danger',
  yellow: '--color-warning',
  orange: '--color-scene-orange',
  teal: '--color-scene-teal',
};

/** Theme colour of a data cell state; null means neutral or muted. */
export const CELL_STATE_VAR: Record<RuntimeSceneCellState, string | null> = {
  default: null,
  visited: null,
  compare: '--color-warning',
  current: '--color-warning',
  swap: '--color-scene-orange',
  frontier: '--color-scene-orange',
  sorted: '--color-success',
  path: '--color-success',
  error: '--color-danger',
};

export const tone = (variable: string, alpha = 1) =>
  `rgb(var(${variable}) / ${alpha})`;

/** Array cells in these states are raised onto the comparator. */
export const isLifted = (state: RuntimeSceneCellState | undefined) =>
  state === 'compare' || state === 'swap';

/**
 * The span the comparator bridges: from the first to the last lifted cell, or
 * null when nothing is being compared.
 */
export function comparatorSpan(
  states: Array<RuntimeSceneCellState | undefined>,
): { from: number; to: number; swapping: boolean } | null {
  const lifted = states.flatMap((state, index) =>
    isLifted(state) ? [index] : [],
  );
  if (lifted.length === 0) return null;
  return {
    from: lifted[0],
    to: lifted[lifted.length - 1],
    swapping: states.some((state) => state === 'swap'),
  };
}

/** Left edge and width, in percent, of cells `from..to` out of `count`. */
export function spanPercent(from: number, to: number, count: number) {
  const safe = Math.max(1, count);
  return {
    left: `${(from / safe) * 100}%`,
    width: `${((to - from + 1) / safe) * 100}%`,
  };
}

/** Centre of a row-major grid cell, in percent of the gapless grid box. */
export function cellCentrePercent(index: number, rows: number, cols: number) {
  return {
    left: `${(((index % cols) + 0.5) / cols) * 100}%`,
    top: `${((Math.floor(index / cols) + 0.5) / rows) * 100}%`,
  };
}
