import { describe, expect, it } from 'vitest';
import { systemDesignScenarios } from './scenarios';
import {
  applyGraphPatch,
  evaluateSystemDesign,
  generateSystemFlow,
  validateSystemGraph,
} from './systemDesign';

describe('system design domain', () => {
  const scenario = systemDesignScenarios[0];
  it('rejects dangling and self edges', () => {
    const graph = structuredClone(scenario.initialGraph);
    graph.edges.push({ id: 'bad', from: 'client-1', to: 'missing' });
    expect(validateSystemGraph(graph).join(' ')).toMatch(/dangling/i);
  });
  it('removes incident edges with a node patch', () => {
    const result = applyGraphPatch(scenario.initialGraph, [
      { op: 'remove-node', nodeId: 'dns-1' },
    ]);
    expect(
      result.graph?.edges.some(
        (edge) => edge.from === 'dns-1' || edge.to === 'dns-1',
      ),
    ).toBe(false);
  });
  it('rejects malformed provider operations without throwing', () => {
    expect(
      applyGraphPatch(scenario.initialGraph, [
        { op: 'add-node' },
      ] as unknown as never[]),
    ).toEqual({ errors: ['Proposal contains an invalid add-node operation.'] });
  });
  it('scores the initial graph deterministically', () => {
    expect(
      evaluateSystemDesign(
        scenario,
        scenario.initialGraph,
        'A sufficiently detailed cache invalidation and cost trade-off.',
      ).score,
    ).toBe(20);
  });
  it('explains a missing flow component', () => {
    expect(
      generateSystemFlow(scenario, scenario.initialGraph, 'asset-request')
        .error,
    ).toMatch(/cdn/i);
  });
});
