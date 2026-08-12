import type { VisualStagePhase } from '@algoflow/contracts';

export interface ComplexitySnapshot {
  id: string;
  phase: VisualStagePhase;
  visibleCurves: Array<'constant' | 'linear' | 'quadratic'>;
  inputSize: number;
  operations: { constant: number; linear: number; quadratic: number };
  narration: string;
}

export function createComplexitySteps(): ComplexitySnapshot[] {
  return [
    {
      id: 'complexity-initial',
      phase: 'initial',
      visibleCurves: ['constant'],
      inputSize: 10,
      operations: { constant: 1, linear: 10, quadratic: 100 },
      narration: 'Constant work stays flat as input grows.',
    },
    {
      id: 'complexity-linear',
      phase: 'transition',
      visibleCurves: ['constant', 'linear'],
      inputSize: 100,
      operations: { constant: 1, linear: 100, quadratic: 10_000 },
      narration: 'Linear work adds one bounded unit for each input item.',
    },
    {
      id: 'complexity-quadratic',
      phase: 'transition',
      visibleCurves: ['constant', 'linear', 'quadratic'],
      inputSize: 1_000,
      operations: { constant: 1, linear: 1_000, quadratic: 1_000_000 },
      narration: 'Quadratic work accelerates because pairs grow with n × n.',
    },
    {
      id: 'complexity-failure',
      phase: 'failure',
      visibleCurves: ['linear', 'quadratic'],
      inputSize: 10_000,
      operations: { constant: 1, linear: 10_000, quadratic: 100_000_000 },
      narration:
        'At n = 10,000, a nested scan models 100 million operations. Small-input intuition has failed.',
    },
    {
      id: 'complexity-recovery',
      phase: 'recovery',
      visibleCurves: ['constant', 'linear'],
      inputSize: 10_000,
      operations: { constant: 1, linear: 10_000, quadratic: 100_000_000 },
      narration:
        'Recover by changing the algorithmic model: a linear scan keeps the same input near 10,000 operations.',
    },
    {
      id: 'complexity-terminal',
      phase: 'terminal',
      visibleCurves: ['constant', 'linear', 'quadratic'],
      inputSize: 10_000,
      operations: { constant: 1, linear: 10_000, quadratic: 100_000_000 },
      narration:
        'Complete: growth rate predicts scale. Compare models before optimizing individual instructions.',
    },
  ];
}
