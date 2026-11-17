import type { SystemDesignGraph, SystemRubricRule } from '@algoflow/contracts';
import { describe, expect, it } from 'vitest';
import { freeSpot, suggestGhosts } from './ghostSuggestions';

const graph: SystemDesignGraph = {
  nodes: [
    {
      id: 'svc',
      type: 'service',
      label: 'Service',
      x: 520,
      y: 220,
      config: {},
    },
    {
      id: 'db',
      type: 'relational-database',
      label: 'DB',
      x: 760,
      y: 220,
      config: {},
    },
  ],
  edges: [{ id: 'svc-db', from: 'svc', to: 'db' }],
};

const rule = (
  id: string,
  check: SystemRubricRule['check'],
): SystemRubricRule => ({
  id,
  conceptId: id,
  title: id,
  category: 'latency',
  weight: 10,
  check,
  success: '',
  failure: `Add a ${id}.`,
  reviewPrompt: '',
  reviewAnswer: '',
});

describe('ghost suggestions', () => {
  it('places a missing flow block between its neighbours without overlap', () => {
    const [ghost] = suggestGhosts(graph, {
      kind: 'node',
      nodeType: 'cache',
      afterId: 'svc',
      beforeId: 'db',
    });
    expect(ghost).toMatchObject({
      kind: 'node',
      nodeType: 'cache',
      x: 640,
      connectFromId: 'svc',
      connectToId: 'db',
    });
    // The midpoint (640, 220) is too close to both blocks, so it drops a lane.
    expect(ghost.kind === 'node' && ghost.y).toBe(350);
  });

  it('suggests a missing connection between existing blocks', () => {
    expect(
      suggestGhosts(graph, { kind: 'edge', fromId: 'db', toId: 'svc' }),
    ).toEqual([
      expect.objectContaining({ kind: 'edge', fromId: 'db', toId: 'svc' }),
    ]);
  });

  it('adds failed add-a-block rules once per type and respects the limit', () => {
    const ghosts = suggestGhosts(
      graph,
      { kind: 'node', nodeType: 'cache', afterId: 'svc' },
      [
        rule('cache', { kind: 'node-present', nodeType: 'cache' }),
        rule('lb', { kind: 'node-present', nodeType: 'load-balancer' }),
        rule('db', { kind: 'node-present', nodeType: 'relational-database' }),
        rule('queue', { kind: 'node-count', nodeType: 'queue', minCount: 1 }),
        rule('tls', { kind: 'config-truthy', nodeType: 'service', key: 'tls' }),
      ],
      3,
    );
    expect(
      ghosts.map((ghost) => ghost.kind === 'node' && ghost.nodeType),
    ).toEqual(['cache', 'load-balancer', 'queue']);
    const points = ghosts.flatMap((ghost) =>
      ghost.kind === 'node' ? [{ x: ghost.x, y: ghost.y }] : [],
    );
    for (const [index, point] of points.entries())
      for (const other of [...graph.nodes, ...points.slice(index + 1)])
        expect(
          Math.abs(point.x - other.x) >= 150 ||
            Math.abs(point.y - other.y) >= 100,
        ).toBe(true);
  });

  it('keeps a free spot inside the canvas bounds', () => {
    expect(freeSpot(2000, -50, [])).toEqual({ x: 924, y: 76 });
  });
});
