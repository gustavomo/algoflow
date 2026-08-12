import { describe, expect, it } from 'vitest';
import { createComplexitySteps } from './complexitySteps';
import { createGridTraversalSteps } from './gridTraversal';
import {
  createSlidingWindowSteps,
  createTwoPointerSteps,
} from './pointerSteps';

describe('complete visual traces', () => {
  it.each([
    ['complexity', createComplexitySteps()],
    ['two pointers', createTwoPointerSteps()],
    ['sliding window', createSlidingWindowSteps()],
    ['BFS', createGridTraversalSteps('bfs')],
    ['DFS', createGridTraversalSteps('dfs')],
  ])('%s has a single initial and terminal snapshot', (_, steps) => {
    expect(steps[0].phase).toBe('initial');
    expect(steps.at(-1)?.phase).toBe('terminal');
    expect(steps.filter((step) => step.phase === 'initial')).toHaveLength(1);
    expect(steps.filter((step) => step.phase === 'terminal')).toHaveLength(1);
  });

  it.each(['bfs', 'dfs'] as const)(
    '%s drains the complete frontier',
    (mode) => {
      const terminal = createGridTraversalSteps(mode).at(-1)!;
      expect(terminal.frontier).toEqual([]);
      expect(terminal.visited).toHaveLength(20);
      expect(terminal.path[0]).toBe(0);
      expect(terminal.path.at(-1)).toBe(24);
    },
  );
});
