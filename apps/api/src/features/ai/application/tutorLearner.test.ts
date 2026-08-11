import type { TutorRequest } from '@algoflow/contracts';
import { describe, expect, it } from 'vitest';
import { mockTutorClient } from '../adapters/providers/mockTutorClient';
import { localJsonRetriever } from '../adapters/retrieval/retrieve';
import { parseTutorRequest } from '../domain/tutorContext';
import { sanitizeTutorOverlay } from '../domain/tutorContext';
import { scenarioBySlug } from '../../simulations/domain/scenarios';
import { hashCacheKey } from '../../../platform/cache/memo';
import { tutorLearner } from './tutorLearner';

const request: TutorRequest = {
  question: 'What should I compare next?',
  helpLevel: 'nudge',
  context: {
    kind: 'bubble-sort',
    lessonSlug: 'bubble-sort-js',
    phase: 'predict',
    items: [
      { id: 'a', value: 5 },
      { id: 'b', value: 3 },
    ],
    selectedItemIds: ['a', 'b'],
    narration: 'Choose an adjacent pair.',
  },
};

describe('context-aware tutor', () => {
  it('returns a grounded nudge and a scene-safe overlay', async () => {
    const result = await tutorLearner(
      mockTutorClient,
      localJsonRetriever,
      request,
    );
    expect(result.resolved).toBe(true);
    expect(result.overlay).toEqual({
      kind: 'highlight-items',
      itemIds: ['a', 'b'],
      label: 'Compare only this adjacent decision.',
    });
    expect(result.message).not.toMatch(/left value is greater/i);
  });

  it('rejects item references outside the current scene', () => {
    expect(
      parseTutorRequest({
        ...request,
        context: { ...request.context, selectedItemIds: ['missing'] },
      }).error,
    ).toMatch(/selection context/i);
  });

  it('drops provider overlays that reference IDs outside the scene', () => {
    expect(
      sanitizeTutorOverlay(
        {
          kind: 'highlight-items',
          itemIds: ['missing'],
          label: 'Invented anchor',
        },
        request.context,
      ),
    ).toBeUndefined();
  });

  it('rejects non-canonical lesson and scenario references', () => {
    expect(
      parseTutorRequest({
        ...request,
        context: { ...request.context, lessonSlug: 'missing-lesson' },
      }).error,
    ).toMatch(/bubble sort context/i);
    expect(
      parseTutorRequest({
        ...request,
        context: {
          kind: 'design-lab',
          scenarioSlug: 'missing-scenario',
          graph: { nodes: [], edges: [] },
        },
      }).error,
    ).toMatch(/scenario is unknown/i);
  });

  it('rejects private or unknown fields before provider invocation', () => {
    expect(
      parseTutorRequest({
        ...request,
        context: {
          ...request.context,
          privateNotes: 'This must never reach retrieval or a provider.',
        },
      }).error,
    ).toMatch(/invalid|unsupported/i);
  });

  it('supports graduated help and canonical Design Lab context', async () => {
    const explanation = await mockTutorClient.tutor({
      question: request.question,
      helpLevel: 'explanation',
      context: request.context,
      groundedContext: '',
    });
    expect(explanation.message).toMatch(/swaps only when/i);

    const scenario = scenarioBySlug.get('url-shortener')!;
    const parsed = parseTutorRequest({
      question: 'Where is the current pressure?',
      helpLevel: 'guided-question',
      context: {
        kind: 'design-lab',
        scenarioSlug: scenario.slug,
        graph: scenario.initialGraph,
      },
    });
    expect(parsed.error).toBeUndefined();
    expect(parsed.value?.context.kind).toBe('design-lab');
  });

  it('rejects unresolved local citations without invoking the provider', async () => {
    let invoked = false;
    const result = await tutorLearner(
      {
        provider: 'mock',
        async tutor() {
          invoked = true;
          return { message: 'Unexpected invocation.' };
        },
      },
      localJsonRetriever,
      { ...request, citations: ['missing-citation'] },
    );
    expect(result.resolved).toBe(false);
    expect(invoked).toBe(false);
  });

  it('changes cache identity with scene state and surfaces provider failure', async () => {
    const changed = {
      ...request,
      context: { ...request.context, phase: 'feedback' as const },
    };
    expect(hashCacheKey(request)).not.toBe(hashCacheKey(changed));
    await expect(
      tutorLearner(
        {
          provider: 'mock',
          async tutor() {
            throw new Error('Provider unavailable.');
          },
        },
        localJsonRetriever,
        request,
      ),
    ).rejects.toThrow(/provider unavailable/i);
  });
});
