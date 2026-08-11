import type {
  ReviewState,
  SystemDesignAttempt,
  SystemDesignDraft,
} from '@algoflow/contracts';
import { describe, expect, it } from 'vitest';
import { mockDesignProposalProvider } from '../adapters/designProposalProviders';
import { systemDesignScenarios } from '../domain/scenarios';
import { generateSystemFlow } from '../domain/systemDesign';
import type { SimulationRepository } from '../ports/simulationRepository';
import {
  evaluateSimulation,
  getSimulationWorkspace,
  proposeSimulationDesign,
  runSimulationChallenge,
  saveSimulationDraft,
} from './simulationUseCases';

class TestSimulationRepository implements SimulationRepository {
  drafts = new Map<string, SystemDesignDraft>();
  attempts: SystemDesignAttempt[] = [];
  async getDraft(scenarioSlug: string) {
    return this.drafts.get(scenarioSlug);
  }
  async saveDraft(draft: SystemDesignDraft) {
    this.drafts.set(draft.scenarioSlug, draft);
    return draft;
  }
  async listAttempts(scenarioSlug?: string) {
    return this.attempts.filter(
      (attempt) => !scenarioSlug || attempt.scenarioSlug === scenarioSlug,
    );
  }
  async saveAttempt(attempt: SystemDesignAttempt) {
    this.attempts.push(attempt);
    return attempt;
  }
}

class TestReviewRepository {
  reviews = new Map<string, ReviewState>();
  async getReview(conceptId: string) {
    return this.reviews.get(conceptId);
  }
  async saveReview(review: ReviewState) {
    this.reviews.set(review.conceptId, review);
    return review;
  }
  async listDueReviews(now: Date) {
    return [...this.reviews.values()].filter(
      (review) => new Date(review.dueAt) <= now,
    );
  }
}

describe('simulation use cases', () => {
  it('previews a valid mock patch without persisting it', async () => {
    const repository = new TestSimulationRepository();
    for (const scenario of systemDesignScenarios) {
      const result = await proposeSimulationDesign(mockDesignProposalProvider, {
        scenarioSlug: scenario.slug,
        graph: scenario.initialGraph,
      });
      expect(result.value?.provider).toBe('mock');
      expect(result.value?.operations.length).toBeGreaterThan(0);
      expect(
        generateSystemFlow(
          scenario,
          result.value!.previewGraph,
          scenario.flows[0].id,
        ).error,
      ).toBeUndefined();
      expect(
        (await getSimulationWorkspace(repository, scenario.slug))?.draft,
      ).toBeUndefined();
    }
  });

  it('bounds a design proposal to a valid selected migration phase', async () => {
    const scenario = systemDesignScenarios.find(
      (candidate) => candidate.slug === 'monolith-strangler-migration',
    )!;
    const phase = scenario.phases![0];
    const proposal = await proposeSimulationDesign(mockDesignProposalProvider, {
      scenarioSlug: scenario.slug,
      graph: scenario.initialGraph,
      phaseId: phase.id,
    });
    expect(proposal.value?.rationale).toMatch(/prepare/i);
    expect(
      await proposeSimulationDesign(mockDesignProposalProvider, {
        scenarioSlug: scenario.slug,
        graph: scenario.initialGraph,
        phaseId: 'unknown-phase',
      }),
    ).toEqual({ error: 'The selected migration phase is not available.' });
  });

  it('saves one mutable draft and immutable attempts', async () => {
    const repository = new TestSimulationRepository();
    const reviews = new TestReviewRepository();
    const scenario = systemDesignScenarios[0];
    const proposal = await proposeSimulationDesign(mockDesignProposalProvider, {
      scenarioSlug: scenario.slug,
      graph: scenario.initialGraph,
    });
    const graph = proposal.value!.previewGraph;

    const draft = await saveSimulationDraft(repository, {
      scenarioSlug: scenario.slug,
      name: 'Edge delivery design',
      graph,
    });
    const attempt = await evaluateSimulation(
      repository,
      reviews,
      {
        scenarioSlug: scenario.slug,
        graph,
        tradeOffs:
          'Versioned assets reduce invalidation risk, while a longer TTL lowers origin cost at the expense of freshness.',
      },
      new Date('2026-08-09T12:00:00.000Z'),
    );

    expect(draft.value?.name).toBe('Edge delivery design');
    expect(attempt.value?.evaluation.score).toBe(100);
    expect(repository.attempts).toHaveLength(1);
    expect(reviews.reviews).toHaveLength(0);
  });

  it('creates review evidence for failed deterministic rubric items', async () => {
    const repository = new TestSimulationRepository();
    const reviews = new TestReviewRepository();
    const scenario = systemDesignScenarios[1];
    const result = await evaluateSimulation(
      repository,
      reviews,
      {
        scenarioSlug: scenario.slug,
        graph: scenario.initialGraph,
        tradeOffs:
          'Strong key uniqueness protects correctness, while hot-key caching reduces read latency and database cost.',
      },
      new Date('2026-08-09T12:00:00.000Z'),
    );
    expect(result.value?.evaluation.score).toBe(40);
    expect(reviews.reviews.size).toBe(3);
    expect([...reviews.reviews.values()][0]?.sourceType).toBe(
      'simulation-rubric',
    );
  });

  it('exposes and runs the scenario challenge without persistence', async () => {
    const repository = new TestSimulationRepository();
    const workspace = await getSimulationWorkspace(repository, 'url-shortener');
    expect(workspace?.challenge?.id).toBe('url-shortener-traffic-spike');
    const result = runSimulationChallenge({
      scenarioSlug: workspace!.scenario.slug,
      challengeId: workspace!.challenge!.id,
      graph: workspace!.scenario.initialGraph,
      loadProfile: 'surge',
      failure: 'load-spike',
      prediction: 'queue-pressure',
    });
    expect(result.value?.predictionMatches).toBe(true);
    expect(repository.attempts).toHaveLength(0);
  });
});
