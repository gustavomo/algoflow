import { describe, expect, it } from 'vitest';
import type { RuntimeSceneStep } from '@algoflow/contracts';
import {
  countChallenges,
  initialPredictState,
  isComplete,
  isWaiting,
  predictReducer,
  type PredictEvent,
} from './predictChallenge';

const plain = (label: string): RuntimeSceneStep => ({
  label,
  narration: label,
  codeLines: [],
  tokens: [],
  output: [],
});
const asking = (label: string, answer: number): RuntimeSceneStep => ({
  ...plain(label),
  challenge: {
    prompt: 'What next?',
    options: ['A', 'B', 'C'],
    answer,
    explanation: 'Because.',
  },
});

const steps = [
  plain('intro'),
  asking('q1', 1),
  plain('r1'),
  asking('q2', 0),
  plain('end'),
];
const run = (events: PredictEvent[]) =>
  events.reduce(
    (state, event) => predictReducer(steps, state, event),
    initialPredictState,
  );

describe('predictReducer', () => {
  it('plays through plain steps and stops at a question', () => {
    const state = run([{ type: 'ADVANCE' }, { type: 'ADVANCE' }]);
    expect(state.stepIndex).toBe(1);
    expect(isWaiting(steps, state)).toBe(true);
    expect(countChallenges(steps)).toBe(2);
  });

  it('reveals the next step only after the right pick', () => {
    const solved = run([{ type: 'ADVANCE' }, { type: 'PICK', option: 1 }]);
    expect(solved).toMatchObject({ solved: true, asked: 1, firstTry: 1 });
    expect(isWaiting(steps, solved)).toBe(false);
    expect(predictReducer(steps, solved, { type: 'ADVANCE' })).toMatchObject({
      stepIndex: 2,
      solved: false,
      wrongPicks: [],
    });
  });

  it('records wrong picks, ignores repeats and denies first-try credit', () => {
    const state = run([
      { type: 'ADVANCE' },
      { type: 'PICK', option: 0 },
      { type: 'PICK', option: 0 },
      { type: 'PICK', option: 7 },
    ]);
    expect(state).toMatchObject({ wrongPicks: [0], solved: false, asked: 0 });
    const solved = predictReducer(steps, state, { type: 'PICK', option: 1 });
    expect(solved).toMatchObject({ solved: true, asked: 1, firstTry: 0 });
    // A solved question accepts no further picks.
    expect(predictReducer(steps, solved, { type: 'PICK', option: 2 })).toBe(
      solved,
    );
  });

  it('skips straight to the next question, never past one', () => {
    const first = run([{ type: 'SKIP' }]);
    expect(first.stepIndex).toBe(1);
    expect(predictReducer(steps, first, { type: 'SKIP' })).toBe(first);
    const second = run([
      { type: 'SKIP' },
      { type: 'PICK', option: 1 },
      { type: 'SKIP' },
    ]);
    expect(second).toMatchObject({ stepIndex: 3, solved: false, asked: 1 });
    const end = run([
      { type: 'SKIP' },
      { type: 'PICK', option: 1 },
      { type: 'SKIP' },
      { type: 'PICK', option: 0 },
      { type: 'SKIP' },
    ]);
    expect(isComplete(steps, end)).toBe(true);
  });

  it('ignores picks on steps that ask nothing', () => {
    expect(run([{ type: 'PICK', option: 0 }])).toBe(initialPredictState);
  });

  it('completes on the last step and resets', () => {
    const end = run([
      { type: 'ADVANCE' },
      { type: 'PICK', option: 1 },
      { type: 'ADVANCE' },
      { type: 'ADVANCE' },
      { type: 'PICK', option: 0 },
      { type: 'ADVANCE' },
    ]);
    expect(end).toMatchObject({ stepIndex: 4, asked: 2, firstTry: 2 });
    expect(isComplete(steps, end)).toBe(true);
    expect(predictReducer(steps, end, { type: 'ADVANCE' })).toBe(end);
    expect(predictReducer(steps, end, { type: 'RESET' })).toBe(
      initialPredictState,
    );
  });
});
