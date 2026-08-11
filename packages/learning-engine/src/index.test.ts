import { describe, expect, it } from 'vitest';
import {
  createBubbleSortChallenge,
  createBubbleSortSteps,
  evaluateBubbleSortPrediction,
  validateBubbleSortChallengeDefinition,
} from './index';

const definition = {
  id: 'bubble-sort-core',
  version: 1 as const,
  title: 'Bubble Sort decisions',
  objective: 'Predict each adjacent comparison and swap.',
  values: [5, 3, 8, 4, 2],
};

describe('Bubble Sort learning engine', () => {
  it('produces immutable sorted snapshots', () => {
    const steps = createBubbleSortSteps(definition.values);
    expect(steps.at(-1)?.items.map((item) => item.value)).toEqual([
      2, 3, 4, 5, 8,
    ]);
    expect(steps[0].items.map((item) => item.value)).toEqual(definition.values);
  });

  it('derives prediction gates from the same trace', () => {
    const challenge = createBubbleSortChallenge(definition);
    const first = challenge.decisions[0];
    expect(first.pairValues).toEqual([5, 3]);
    expect(first.shouldSwap).toBe(true);
    expect(first.resultSnapshot.items.map((item) => item.value)).toEqual([
      3, 5, 8, 4, 2,
    ]);
  });

  it('explains incorrect pair and swap predictions deterministically', () => {
    const first = createBubbleSortChallenge(definition).decisions[0];
    expect(
      evaluateBubbleSortPrediction(first, ['item-1', 'item-2'], true),
    ).toMatchObject({ correct: false, pairCorrect: false });
    expect(
      evaluateBubbleSortPrediction(first, first.pairItemIds, false),
    ).toMatchObject({ correct: false, pairCorrect: true, swapCorrect: false });
    expect(
      evaluateBubbleSortPrediction(first, first.pairItemIds, true),
    ).toMatchObject({ correct: true });
  });

  it('rejects definitions outside safe visual bounds', () => {
    expect(
      validateBubbleSortChallengeDefinition({
        ...definition,
        values: [1, 2],
      }),
    ).toContain('Bubble Sort challenges require 3 to 8 values.');
  });
});
