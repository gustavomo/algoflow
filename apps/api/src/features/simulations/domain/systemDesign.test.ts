import { describe, expect, it } from 'vitest';
import {
  scenarioGroups,
  systemDesignScenarios,
  validateScenarioCatalog,
} from './scenarios';
import {
  applyGraphPatch,
  evaluateSystemDesign,
  generateSystemFlow,
  validateSystemGraph,
} from './systemDesign';

describe('system design domain', () => {
  const scenario = systemDesignScenarios[0];
  it('registers seventeen valid scenarios across four learning categories', () => {
    expect(systemDesignScenarios).toHaveLength(17);
    expect(
      Object.fromEntries(
        Object.entries(scenarioGroups).map(([category, items]) => [
          category,
          items.length,
        ]),
      ),
    ).toEqual({
      'system-design': 6,
      migration: 4,
      database: 4,
      reliability: 3,
    });
    expect(validateScenarioCatalog()).toEqual([]);
  });
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
  it('rejects unknown and malformed bounded node configuration', () => {
    const graph = structuredClone(scenario.initialGraph);
    graph.nodes[0].config = { unknown: true };
    expect(validateSystemGraph(graph).join(' ')).toMatch(
      /unsupported configuration key/i,
    );
    graph.nodes[0].config = { replicas: 0 };
    expect(validateSystemGraph(graph).join(' ')).toMatch(/replicas/i);
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
  it('evaluates node counts, exact configuration, and labeled edges', () => {
    const sharding = systemDesignScenarios.find(
      (candidate) => candidate.slug === 'tenant-sharding',
    )!;
    const shardedGraph = structuredClone(sharding.initialGraph);
    shardedGraph.nodes.push({
      id: 'shard-b',
      type: 'relational-database',
      label: 'Shard B',
      x: 760,
      y: 340,
      config: { durable: true },
    });
    expect(
      evaluateSystemDesign(sharding, shardedGraph, '').evidence.find(
        ({ ruleId }) => ruleId === 'shard-count',
      )?.passed,
    ).toBe(true);

    const multitenant = systemDesignScenarios.find(
      (candidate) => candidate.slug === 'multitenant-saas',
    )!;
    const tenantGraph = structuredClone(multitenant.initialGraph);
    tenantGraph.nodes.find((node) => node.type === 'service')!.config.replicas =
      3;
    expect(
      evaluateSystemDesign(multitenant, tenantGraph, '').evidence.find(
        ({ ruleId }) => ruleId === 'tenant-replicas',
      )?.passed,
    ).toBe(true);

    const ledger = systemDesignScenarios.find(
      (candidate) => candidate.slug === 'consistent-ledger',
    )!;
    expect(
      evaluateSystemDesign(ledger, ledger.initialGraph, '').evidence.find(
        ({ ruleId }) => ruleId === 'ledger-path',
      )?.passed,
    ).toBe(true);
  });
});
