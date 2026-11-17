import type {
  SystemChallengeStep,
  SystemDesignGraph,
  SystemFlowStep,
} from '@algoflow/contracts';
import { describe, expect, it } from 'vitest';
import {
  NETWORK_HOP_MS,
  NODE_LATENCY_MS,
  buildFlowTrace,
  tokenRestPoint,
  tokenTravel,
} from './flowTrace';

const graph: SystemDesignGraph = {
  nodes: [
    { id: 'c', type: 'client', label: 'Client', x: 100, y: 200, config: {} },
    { id: 's', type: 'service', label: 'Service', x: 300, y: 200, config: {} },
    { id: 'k', type: 'cache', label: 'Cache', x: 500, y: 200, config: {} },
    {
      id: 'd',
      type: 'relational-database',
      label: 'DB',
      x: 700,
      y: 200,
      config: {},
    },
  ],
  edges: [
    { id: 'cs', from: 'c', to: 's' },
    { id: 'sk', from: 's', to: 'k' },
    { id: 'kd', from: 'k', to: 'd' },
  ],
};

const step = (
  nodeId: string,
  phase: SystemFlowStep['phase'],
  edgeId?: string,
): SystemFlowStep => ({ nodeId, edgeId, phase, label: '', narration: '' });

const flow = [
  step('c', 'initial'),
  step('c', 'transition'),
  step('s', 'transition', 'cs'),
  step('k', 'transition', 'sk'),
  step('d', 'transition', 'kd'),
  step('d', 'terminal', 'kd'),
];

describe('flow trace', () => {
  it('accumulates modelled latency hop by hop', () => {
    const frames = buildFlowTrace(flow, graph);
    const service = NODE_LATENCY_MS.service + NETWORK_HOP_MS;
    const cache = NODE_LATENCY_MS.cache + NETWORK_HOP_MS;
    const db = NODE_LATENCY_MS['relational-database'] + NETWORK_HOP_MS;
    expect(frames.map((frame) => frame.totalMs)).toEqual([
      0,
      0,
      service,
      service + cache,
      service + cache + db,
      service + cache + db,
    ]);
    expect(frames[0].caption).toBe('Client · ready · 0ms');
    expect(frames[1].caption).toBe('Client sends · 0ms');
  });

  it('reads a cache that forwards as a miss and the next hop as origin', () => {
    const frames = buildFlowTrace(flow, graph);
    expect(frames[3]).toMatchObject({ tone: 'miss', fromNodeId: 's' });
    expect(frames[3].caption).toMatch(/^cache miss → origin · \d+ms$/);
    expect(frames[4].caption).toMatch(/^origin DB \+\d+ms · \d+ms$/);
    expect(frames[5]).toMatchObject({ tone: 'done' });
    expect(frames[5].caption).toMatch(/^✓ complete · \d+ms$/);
  });

  it('reads a cache that ends the flow as a hit', () => {
    const frames = buildFlowTrace(flow.slice(0, 4), graph);
    expect(frames[3]).toMatchObject({ tone: 'hit' });
    expect(frames[3].caption).toMatch(/^cache hit/);
  });

  it('marks failures and critical challenge metrics as errors', () => {
    const challenge: SystemChallengeStep[] = [
      { ...step('s', 'transition'), metric: 'latency', band: 'elevated' },
      { ...step('d', 'failure'), metric: 'availability', band: 'critical' },
    ];
    const frames = buildFlowTrace(challenge, graph);
    expect(frames[0].tone).toBe('warn');
    expect(frames[1]).toMatchObject({ tone: 'error', fromNodeId: 's' });
    expect(frames[1].caption).toMatch(/^DB ✕ availability/);
  });
});

describe('token travel', () => {
  it('rests beside a node when the step does not move', () => {
    const [frame] = buildFlowTrace([step('c', 'initial')], graph);
    expect(tokenTravel(frame, graph)).toEqual([tokenRestPoint(graph.nodes[0])]);
  });

  it('follows the drawn edge between rest points, in either direction', () => {
    const forward = buildFlowTrace(
      [step('c', 'transition'), step('s', 'transition', 'cs')],
      graph,
    )[1];
    const path = tokenTravel(forward, graph, 4);
    expect(path).toHaveLength(7);
    expect(path[0]).toEqual(tokenRestPoint(graph.nodes[0]));
    expect(path.at(-1)).toEqual(tokenRestPoint(graph.nodes[1]));
    expect(path[1].x).toBeLessThan(path[5].x);

    const backward = buildFlowTrace(
      [step('s', 'transition'), step('c', 'transition')],
      graph,
    )[1];
    expect(backward.edgeId).toBe('cs');
    const reversed = tokenTravel(backward, graph, 4);
    expect(reversed[1].x).toBeGreaterThan(reversed[5].x);
  });
});
