import { describe, expect, it } from 'vitest';
import {
  SYSTEM_NODE_TYPES,
  VISUAL_STAGE_PHASES,
  type SystemEdge,
  type SystemNode,
} from '@algoflow/contracts';
import {
  SYSTEM_CANVAS_LANES,
  SYSTEM_EDGE_VISUALS,
  SYSTEM_NODE_VISUALS,
  SYSTEM_PHASE_VISUALS,
  buildSystemEdgeGeometry,
  classifySystemEdge,
  parallelEdgePosition,
  resolveSystemNodeVisual,
  truncateSystemLabel,
} from './visualGrammar';

const node = (
  id: string,
  type: SystemNode['type'],
  x: number,
  y: number,
): SystemNode => ({ id, type, label: id, x, y, config: {} });

describe('system visual grammar', () => {
  it('covers every supported infrastructure type with semantic metadata', () => {
    expect(Object.keys(SYSTEM_NODE_VISUALS).sort()).toEqual(
      [...SYSTEM_NODE_TYPES].sort(),
    );
    for (const type of SYSTEM_NODE_TYPES) {
      const visual = resolveSystemNodeVisual(type);
      expect(visual.type).toBe(type);
      expect(visual.mark).not.toBe('?');
      expect(visual.meaning.length).toBeGreaterThan(12);
      expect(visual.anchorX).toBeGreaterThan(20);
      expect(visual.anchorY).toBeGreaterThan(20);
    }
    expect(new Set(SYSTEM_CANVAS_LANES.map((lane) => lane.id))).toEqual(
      new Set(['edge', 'compute', 'state', 'control']),
    );
  });

  it('keeps an accessible neutral fallback for a future unknown type', () => {
    expect(resolveSystemNodeVisual('quantum-router')).toMatchObject({
      type: 'unknown',
      mark: '?',
      meaning: 'Unknown infrastructure type',
    });
  });

  it('classifies static paths and lets canonical lifecycle phases win', () => {
    const client = node('client', 'client', 100, 100);
    const cache = node('cache', 'cache', 300, 100);
    const queue = node('queue', 'queue', 500, 100);
    const telemetry = node('telemetry', 'observability', 500, 300);
    const edge = (id: string, label?: string): SystemEdge => ({
      id,
      from: client.id,
      to: cache.id,
      label,
    });

    expect(classifySystemEdge(edge('cache', 'cache miss'), client, cache)).toBe(
      'cache',
    );
    expect(
      classifySystemEdge(
        { id: 'queue', from: cache.id, to: queue.id },
        cache,
        queue,
      ),
    ).toBe('async');
    expect(
      classifySystemEdge(
        { id: 'metrics', from: queue.id, to: telemetry.id },
        queue,
        telemetry,
      ),
    ).toBe('observability');
    expect(
      classifySystemEdge(edge('failed'), client, cache, 'request', 'failure'),
    ).toBe('failure');
    expect(
      classifySystemEdge(
        edge('recovered'),
        client,
        cache,
        'request',
        'recovery',
      ),
    ).toBe('recovery');
    expect(SYSTEM_EDGE_VISUALS.failure.token).toBe('cross');
    expect(SYSTEM_EDGE_VISUALS.recovery.dasharray).not.toBe(
      SYSTEM_EDGE_VISUALS.failure.dasharray,
    );
  });

  it('defines static equivalents for every canonical playback phase', () => {
    expect(Object.keys(SYSTEM_PHASE_VISUALS).sort()).toEqual(
      [...VISUAL_STAGE_PHASES].sort(),
    );
    for (const phase of VISUAL_STAGE_PHASES) {
      expect(SYSTEM_PHASE_VISUALS[phase].label).toBeTruthy();
      expect(SYSTEM_PHASE_VISUALS[phase].symbol).toBeTruthy();
    }
  });

  it('anchors curves outside glyph centers and offsets parallel connections', () => {
    const from = node('from', 'service', 120, 180);
    const to = node('to', 'relational-database', 520, 280);
    const first = buildSystemEdgeGeometry(from, to, 0, 2);
    const second = buildSystemEdgeGeometry(from, to, 1, 2);
    expect(first.start).not.toEqual({ x: from.x, y: from.y });
    expect(first.end).not.toEqual({ x: to.x, y: to.y });
    expect(first.path).not.toBe(second.path);
    expect(first.middle).not.toEqual(second.middle);

    const edges: SystemEdge[] = [
      { id: 'b', from: from.id, to: to.id },
      { id: 'a', from: to.id, to: from.id },
    ];
    expect(parallelEdgePosition(edges, edges[0]!)).toEqual({
      index: 1,
      count: 2,
    });
    const forwardPosition = parallelEdgePosition(edges, edges[0]!);
    const reversePosition = parallelEdgePosition(edges, edges[1]!);
    const forwardRoute = buildSystemEdgeGeometry(
      from,
      to,
      forwardPosition.index,
      forwardPosition.count,
    );
    const reverseRoute = buildSystemEdgeGeometry(
      to,
      from,
      reversePosition.index,
      reversePosition.count,
    );
    expect(forwardRoute.middle).not.toEqual(reverseRoute.middle);
  });

  it('bounds visible labels while leaving the source label untouched', () => {
    const label = 'Primary transactional database for customer orders';
    expect(truncateSystemLabel(label, 18)).toBe('Primary transacti…');
    expect(label).toBe('Primary transactional database for customer orders');
  });
});
