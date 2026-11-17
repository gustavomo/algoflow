import type { SystemDesignScenario } from '@algoflow/contracts';
import { describe, expect, it } from 'vitest';
import { createSystemFlowSteps } from './flowSteps';

const scenario: SystemDesignScenario = {
  slug: 'request-flow',
  version: 1,
  category: 'system-design',
  topics: ['requests'],
  estimatedMinutes: 10,
  title: 'Request flow',
  summary: 'Test scenario',
  difficulty: 'foundation',
  goal: 'Trace one request.',
  traffic: [],
  requirements: [],
  constraints: [],
  initialGraph: {
    nodes: [
      {
        id: 'client',
        type: 'client',
        label: 'Client',
        x: 100,
        y: 100,
        config: {},
      },
      {
        id: 'service',
        type: 'service',
        label: 'Service',
        x: 300,
        y: 100,
        config: {},
      },
    ],
    edges: [{ id: 'request', from: 'client', to: 'service' }],
  },
  flows: [
    {
      id: 'request',
      title: 'Request',
      kind: 'request',
      nodeTypes: ['client', 'service'],
      narration: ['Send request.', 'Handle request.'],
    },
  ],
  rubric: [],
};

describe('system flow steps', () => {
  it('builds immutable render steps from a connected topology', () => {
    expect(
      createSystemFlowSteps(scenario, scenario.initialGraph, 'request').steps,
    ).toEqual([
      expect.objectContaining({ nodeId: 'client', phase: 'initial' }),
      expect.objectContaining({
        nodeId: 'client',
        edgeId: undefined,
        phase: 'transition',
      }),
      expect.objectContaining({
        nodeId: 'service',
        edgeId: 'request',
        phase: 'transition',
      }),
      expect.objectContaining({ nodeId: 'service', phase: 'terminal' }),
    ]);
  });

  it('explains a missing connection instead of producing partial steps', () => {
    const graph = { ...scenario.initialGraph, edges: [] };
    const result = createSystemFlowSteps(scenario, graph, 'request');
    expect(result.steps).toEqual([]);
    expect(result.error).toMatch(/connect client to service/i);
    expect(result.missing).toEqual({
      kind: 'edge',
      fromId: 'client',
      toId: 'service',
    });
  });

  it('names the missing block and its flow neighbours', () => {
    const graph = {
      nodes: scenario.initialGraph.nodes.filter(
        (node) => node.id !== 'service',
      ),
      edges: [],
    };
    const result = createSystemFlowSteps(scenario, graph, 'request');
    expect(result.error).toMatch(/add a service block/i);
    expect(result.missing).toEqual({
      kind: 'node',
      nodeType: 'service',
      afterId: 'client',
      beforeId: undefined,
    });
  });
});
