import { describe, expect, it } from 'vitest';
import { createBubbleSortSteps } from '../bubbleSort';

describe('createBubbleSortSteps', () => {
  it('emits immutable compare/swap snapshots and a sorted final state', () => {
    const steps = createBubbleSortSteps([5, 3, 4]);
    expect(steps.some((step) => step.phase === 'compare')).toBe(true);
    expect(steps.some((step) => step.phase === 'swap')).toBe(true);
    expect(steps.at(-1)?.items.map((item) => item.value)).toEqual([3, 4, 5]);
    expect(new Set(steps.at(-1)?.items.map((item) => item.id)).size).toBe(3);
    expect(steps.at(-1)?.phase).toBe('complete');
  });
});
