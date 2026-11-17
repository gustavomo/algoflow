import { describe, expect, it } from 'vitest';
import { createComplexitySteps } from './complexitySteps';

describe('complete visual traces', () => {
  it('complexity has a single initial and terminal snapshot', () => {
    const steps = createComplexitySteps();
    expect(steps[0].phase).toBe('initial');
    expect(steps.at(-1)?.phase).toBe('terminal');
    expect(steps.filter((step) => step.phase === 'initial')).toHaveLength(1);
    expect(steps.filter((step) => step.phase === 'terminal')).toHaveLength(1);
  });
});
