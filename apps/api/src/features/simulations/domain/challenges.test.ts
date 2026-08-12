import type { SystemDesignGraph } from '@algoflow/contracts';
import { describe, expect, it } from 'vitest';
import { scenarioBySlug, systemDesignScenarios } from './scenarios';
import {
  getDesignChallengeCatalog,
  getChallengeForScenario,
  runDesignChallenge,
  validateDesignChallengeCatalog,
} from './challenges';

describe('design challenges', () => {
  it('keeps every definition solvable against a real scenario and phase', () => {
    expect(validateDesignChallengeCatalog(systemDesignScenarios)).toEqual([]);
    expect(getDesignChallengeCatalog()).toHaveLength(
      systemDesignScenarios.length,
    );
    expect(
      systemDesignScenarios.every((scenario) =>
        Boolean(getChallengeForScenario(scenario.slug)),
      ),
    ).toBe(true);
    for (const scenario of systemDesignScenarios) {
      const definition = getChallengeForScenario(scenario.slug)!;
      const result = runDesignChallenge({
        scenarioSlug: scenario.slug,
        challengeId: definition.id,
        graph: scenario.initialGraph,
        phaseId: definition.phaseId,
        loadProfile: definition.loadProfiles[0],
        failure: definition.failures[0],
        prediction: definition.predictionOptions[0],
      });
      expect(result.error, scenario.slug).toBeUndefined();
      expect(result.value?.steps[0].phase, scenario.slug).toBe('initial');
      expect(result.value?.steps.at(-1)?.phase, scenario.slug).toBe('terminal');
    }
  });

  it('models the initial URL shortener bottleneck without fake precision', () => {
    const scenario = scenarioBySlug.get('url-shortener')!;
    const definition = getChallengeForScenario(scenario.slug)!;
    const result = runDesignChallenge({
      scenarioSlug: scenario.slug,
      challengeId: definition.id,
      graph: scenario.initialGraph,
      loadProfile: 'surge',
      failure: 'load-spike',
      prediction: 'queue-pressure',
    });
    expect(result.value?.primaryEffect).toBe('queue-pressure');
    expect(result.value?.predictionMatches).toBe(true);
    expect(result.value?.educationalModel).toBe(true);
    expect(result.value?.metrics.every((metric) => metric.band)).toBe(true);
    expect(
      runDesignChallenge({
        scenarioSlug: scenario.slug,
        challengeId: definition.id,
        graph: scenario.initialGraph,
        loadProfile: 'surge',
        failure: 'load-spike',
        prediction: 'queue-pressure',
      }).value,
    ).toEqual(result.value);
  });

  it('changes the overload outcome when visible controls are added', () => {
    const scenario = scenarioBySlug.get('overload-protection')!;
    const definition = getChallengeForScenario(scenario.slug)!;
    const graph: SystemDesignGraph = structuredClone(scenario.initialGraph);
    graph.nodes.find((node) => node.type === 'service')!.config.replicas = 3;
    graph.nodes.push(
      {
        id: 'lb',
        type: 'load-balancer',
        label: 'Capacity boundary',
        x: 280,
        y: 200,
        config: {},
      },
      {
        id: 'queue',
        type: 'queue',
        label: 'Bounded work',
        x: 620,
        y: 400,
        config: {},
      },
    );
    graph.edges.push(
      { id: 'client-lb', from: 'client', to: 'lb' },
      { id: 'lb-service', from: 'lb', to: 'service' },
      { id: 'service-queue', from: 'service', to: 'queue' },
    );
    const result = runDesignChallenge({
      scenarioSlug: scenario.slug,
      challengeId: definition.id,
      graph,
      loadProfile: 'extreme',
      failure: 'load-spike',
      prediction: 'throttled-load',
    });
    expect(result.value?.primaryEffect).toBe('throttled-load');
    expect(result.value?.predictionMatches).toBe(true);
  });

  it('raises an extreme relative band without inventing precise metrics', () => {
    const scenario = scenarioBySlug.get('url-shortener')!;
    const definition = getChallengeForScenario(scenario.slug)!;
    const graph: SystemDesignGraph = structuredClone(scenario.initialGraph);
    graph.nodes.push({
      id: 'cache',
      type: 'cache',
      label: 'Redirect cache',
      x: 650,
      y: 400,
      config: {},
    });
    graph.edges.push({ id: 'service-cache', from: 'service-1', to: 'cache' });
    const result = runDesignChallenge({
      scenarioSlug: scenario.slug,
      challengeId: definition.id,
      graph,
      loadProfile: 'extreme',
      failure: 'load-spike',
      prediction: 'latency-rise',
    });
    expect(result.value?.primaryEffect).toBe('latency-rise');
    expect(result.value?.metrics[0].band).toBe('critical');
    expect(JSON.stringify(result.value?.metrics)).not.toMatch(/\d+ms|rps/i);
  });

  it('rejects a challenge outside its configured phase', () => {
    const scenario = scenarioBySlug.get('monolith-strangler-migration')!;
    const definition = getChallengeForScenario(scenario.slug)!;
    expect(
      runDesignChallenge({
        scenarioSlug: scenario.slug,
        challengeId: definition.id,
        graph: scenario.initialGraph,
        phaseId: 'prepare',
        loadProfile: 'baseline',
        failure: 'dependency-timeout',
        prediction: 'cutover-risk',
      }).error,
    ).toMatch(/configured phase/i);
  });

  it('rejects unsupported challenge and graph references', () => {
    const scenario = scenarioBySlug.get('url-shortener')!;
    const definition = getChallengeForScenario(scenario.slug)!;
    expect(
      runDesignChallenge({
        scenarioSlug: scenario.slug,
        challengeId: 'missing',
        graph: scenario.initialGraph,
        loadProfile: 'surge',
        failure: 'load-spike',
        prediction: 'queue-pressure',
      }).missing,
    ).toBe(true);
    expect(
      runDesignChallenge({
        scenarioSlug: scenario.slug,
        challengeId: definition.id,
        graph: {
          ...scenario.initialGraph,
          edges: [{ id: 'dangling', from: 'missing', to: 'db-1' }],
        },
        loadProfile: 'surge',
        failure: 'load-spike',
        prediction: 'queue-pressure',
      }).error,
    ).toMatch(/dangling/i);
  });
});
