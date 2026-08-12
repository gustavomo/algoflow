import type { VisualStagePhase } from '@algoflow/contracts';

export interface PointerSnapshot {
  id: string;
  phase: VisualStagePhase;
  values: number[];
  left: number;
  right: number;
  target?: number;
  currentValue: number;
  removedIndex?: number;
  addedIndex?: number;
  discardedIndexes: number[];
  bestRange?: [number, number];
  bestValue?: number;
  hypothetical?: boolean;
  narration: string;
}

const POINTER_VALUES = [2, 4, 6, 8, 11, 15, 18];

export function createTwoPointerSteps(): PointerSnapshot[] {
  return [
    {
      id: 'pointer-initial',
      phase: 'initial',
      values: POINTER_VALUES,
      left: 0,
      right: 6,
      target: 19,
      currentValue: 20,
      discardedIndexes: [],
      narration:
        'Start at both ends. The pair sums to 20, one above the target 19.',
    },
    {
      id: 'pointer-counterexample',
      phase: 'failure',
      values: POINTER_VALUES,
      left: 1,
      right: 6,
      target: 19,
      currentValue: 22,
      discardedIndexes: [],
      hypothetical: true,
      narration:
        'Counterexample: moving left would increase the sum to 22. Sorted order tells us that move cannot help.',
    },
    {
      id: 'pointer-recover-right',
      phase: 'recovery',
      values: POINTER_VALUES,
      left: 0,
      right: 5,
      target: 19,
      currentValue: 17,
      discardedIndexes: [6],
      narration:
        'Recover the invariant: move right inward. Every pair using 18 with a larger left value is now safely discarded.',
    },
    {
      id: 'pointer-advance-left',
      phase: 'transition',
      values: POINTER_VALUES,
      left: 1,
      right: 5,
      target: 19,
      currentValue: 19,
      discardedIndexes: [0, 6],
      narration:
        'The sum 17 was too small, so move left inward. The new pair reaches 19.',
    },
    {
      id: 'pointer-terminal',
      phase: 'terminal',
      values: POINTER_VALUES,
      left: 1,
      right: 5,
      target: 19,
      currentValue: 19,
      discardedIndexes: [0, 6],
      bestRange: [1, 5],
      bestValue: 19,
      narration:
        'Complete: 4 + 15 = 19. The monotonic invariant eliminated impossible pairs without a nested scan.',
    },
  ];
}

const WINDOW_VALUES = [2, 3, 1, 5, 4, 3, 6];

export function createSlidingWindowSteps(): PointerSnapshot[] {
  return [
    {
      id: 'window-initial',
      phase: 'initial',
      values: WINDOW_VALUES,
      left: 0,
      right: 2,
      currentValue: 6,
      discardedIndexes: [],
      bestRange: [0, 2],
      bestValue: 6,
      narration:
        'Seed a fixed window of three values. Its sum is 6 and becomes the first best candidate.',
    },
    {
      id: 'window-slide-one',
      phase: 'transition',
      values: WINDOW_VALUES,
      left: 1,
      right: 3,
      currentValue: 9,
      removedIndex: 0,
      addedIndex: 3,
      discardedIndexes: [0],
      bestRange: [1, 3],
      bestValue: 9,
      narration:
        'Subtract the leaving 2 and add the entering 5. The sum becomes 9 without rescanning the window.',
    },
    {
      id: 'window-counterexample',
      phase: 'failure',
      values: WINDOW_VALUES,
      left: 2,
      right: 4,
      currentValue: 10,
      removedIndex: 1,
      addedIndex: 4,
      discardedIndexes: [0, 1],
      bestRange: [1, 3],
      bestValue: 9,
      hypothetical: true,
      narration:
        'Counterexample: recomputing 1 + 5 + 4 is correct but repeats work already represented by the previous sum.',
    },
    {
      id: 'window-recover-incremental',
      phase: 'recovery',
      values: WINDOW_VALUES,
      left: 2,
      right: 4,
      currentValue: 10,
      removedIndex: 1,
      addedIndex: 4,
      discardedIndexes: [0, 1],
      bestRange: [2, 4],
      bestValue: 10,
      narration:
        'Recover incremental state: 9 − 3 + 4 = 10. Only the boundary changes matter.',
    },
    {
      id: 'window-slide-three',
      phase: 'transition',
      values: WINDOW_VALUES,
      left: 3,
      right: 5,
      currentValue: 12,
      removedIndex: 2,
      addedIndex: 5,
      discardedIndexes: [0, 1, 2],
      bestRange: [3, 5],
      bestValue: 12,
      narration: 'Slide again: 10 − 1 + 3 = 12, a new maximum.',
    },
    {
      id: 'window-slide-four',
      phase: 'transition',
      values: WINDOW_VALUES,
      left: 4,
      right: 6,
      currentValue: 13,
      removedIndex: 3,
      addedIndex: 6,
      discardedIndexes: [0, 1, 2, 3],
      bestRange: [4, 6],
      bestValue: 13,
      narration: 'The final slide produces 4 + 3 + 6 = 13.',
    },
    {
      id: 'window-terminal',
      phase: 'terminal',
      values: WINDOW_VALUES,
      left: 4,
      right: 6,
      currentValue: 13,
      discardedIndexes: [0, 1, 2, 3],
      bestRange: [4, 6],
      bestValue: 13,
      narration:
        'Complete: the best length-three window is [4, 3, 6] with sum 13 after one linear pass.',
    },
  ];
}
