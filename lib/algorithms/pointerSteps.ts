export interface PointerSnapshot {
  left: number;
  right: number;
  windowSum?: number;
  narration: string;
}

export function createTwoPointerSteps(): PointerSnapshot[] {
  return [
    {
      left: 0,
      right: 6,
      narration: 'Start at both ends and inspect the pair.',
    },
    {
      left: 1,
      right: 6,
      narration: 'The sum is too small, so move the left pointer.',
    },
    {
      left: 1,
      right: 5,
      narration: 'The sum is too large, so move the right pointer.',
    },
    {
      left: 2,
      right: 5,
      narration: 'Narrow the search without revisiting discarded values.',
    },
    {
      left: 2,
      right: 4,
      narration: 'The invariant isolates the matching pair.',
    },
  ];
}

export function createSlidingWindowSteps(): PointerSnapshot[] {
  return [
    {
      left: 0,
      right: 1,
      windowSum: 5,
      narration: 'Seed the window and its incremental state.',
    },
    {
      left: 0,
      right: 2,
      windowSum: 8,
      narration: 'Expand right and add only the entering value.',
    },
    {
      left: 1,
      right: 3,
      windowSum: 10,
      narration: 'Move the window: subtract left, add right.',
    },
    {
      left: 2,
      right: 4,
      windowSum: 9,
      narration: 'Reuse the previous sum instead of rescanning.',
    },
    {
      left: 3,
      right: 5,
      windowSum: 12,
      narration: 'The best window is visible after one linear pass.',
    },
  ];
}
