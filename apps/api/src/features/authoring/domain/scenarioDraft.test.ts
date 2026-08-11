import { describe, expect, it } from 'vitest';
import { mockScenarioAuthoringProvider } from '../adapters/mockScenarioAuthoringProvider';
import {
  generateScenarioDraft,
  validateScenarioDraft,
} from '../application/scenarioAuthoring';
import { isScenarioAuthoringEnabled } from './scenarioDraft';

describe('scenario authoring evals', () => {
  it('generates deterministic drafts that pass all blocking evals', async () => {
    for (const kind of ['bubble-sort', 'design-lab'] as const) {
      const result = await generateScenarioDraft(
        mockScenarioAuthoringProvider,
        {
          kind,
          objective:
            kind === 'bubble-sort'
              ? 'Practice adjacent swaps'
              : 'Practice overload containment',
          difficulty: 'intermediate',
        },
      );
      expect(result.value?.report.passed).toBe(true);
      expect(result.value?.report.humanReviewRequired).toBe(true);
      expect(result.value?.report.checks).toHaveLength(7);
    }
  });

  it('blocks an inconsistent expected Bubble Sort state', () => {
    const result = validateScenarioDraft({
      id: 'bad-final-state',
      version: 1,
      kind: 'bubble-sort',
      title: 'A valid title',
      objective: 'Expose an inconsistent expected final state.',
      difficulty: 'foundation',
      values: [3, 1, 2],
      expectedFinal: [1, 3, 2],
    });
    expect(result.value?.report.passed).toBe(false);
    expect(
      result.value?.report.checks.find(
        (check) => check.id === 'state-consistency',
      )?.status,
    ).toBe('fail');
  });

  it('is impossible to enable authoring in production', () => {
    expect(
      isScenarioAuthoringEnabled({
        ENABLE_SCENARIO_AUTHORING: '1',
        NODE_ENV: 'production',
      }),
    ).toBe(false);
    expect(
      isScenarioAuthoringEnabled({
        ENABLE_SCENARIO_AUTHORING: '1',
        NODE_ENV: 'development',
      }),
    ).toBe(true);
  });

  it('rejects unknown schema keys and blocks visually oversized drafts', () => {
    expect(
      validateScenarioDraft({
        id: 'unknown-key',
        version: 1,
        kind: 'bubble-sort',
        title: 'Unknown key',
        objective: 'Reject provider fields outside the strict schema.',
        difficulty: 'foundation',
        values: [3, 2, 1],
        expectedFinal: [1, 2, 3],
        invented: true,
      }).error,
    ).toMatch(/schema/i);

    const result = validateScenarioDraft({
      id: 'oversized-visual',
      version: 1,
      kind: 'bubble-sort',
      title: 'Oversized visual',
      objective: 'Block a draft that does not fit the supported SVG scene.',
      difficulty: 'advanced',
      values: [9, 8, 7, 6, 5, 4, 3, 2, 1],
      expectedFinal: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    });
    expect(result.value?.report.passed).toBe(false);
    expect(
      result.value?.report.checks.find(
        (candidate) => candidate.id === 'visual-clarity',
      )?.status,
    ).toBe('fail');
  });

  it('blocks a Design Lab draft whose outcome is not selectable', () => {
    const result = validateScenarioDraft({
      id: 'unsolvable-design-draft',
      version: 1,
      kind: 'design-lab',
      title: 'Missing outcome',
      objective: 'Prove the deterministic result remains selectable.',
      difficulty: 'intermediate',
      scenarioSlug: 'url-shortener',
      challengeId: 'url-shortener-traffic-spike',
      loadProfile: 'surge',
      failure: 'load-spike',
      predictionOptions: ['latency-rise', 'throttled-load'],
      expectedPrimaryEffect: 'queue-pressure',
    });
    expect(result.value?.report.passed).toBe(false);
    expect(
      result.value?.report.checks.find(
        (candidate) => candidate.id === 'solvability',
      )?.status,
    ).toBe('fail');
  });

  it('rejects malformed output from an untrusted generation provider', async () => {
    const result = await generateScenarioDraft(
      {
        provider: 'openai',
        async generate() {
          return {
            id: 'provider-invented-shape',
            kind: 'bubble-sort',
            privatePrompt: 'unsupported',
          };
        },
      },
      {
        kind: 'bubble-sort',
        objective: 'Reject malformed provider output.',
        difficulty: 'foundation',
      },
    );
    expect(result.value).toBeUndefined();
    expect(result.error).toMatch(/metadata|schema/i);
  });
});
