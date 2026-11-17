import type {
  SystemDesignGraph,
  SystemNodeType,
  SystemRubricRule,
} from '@algoflow/contracts';
import type { MissingFlowPart } from './flowSteps';
import { SYSTEM_CANVAS_LANES, resolveSystemNodeVisual } from './visualGrammar';

/**
 * A suggested block drawn as a dashed ghost on the canvas. Placing it adds
 * the block at (x, y) and wires the listed neighbours, so the flow it came
 * from can run straight away.
 */
export interface GhostNode {
  kind: 'node';
  id: string;
  nodeType: SystemNodeType;
  x: number;
  y: number;
  connectFromId?: string;
  connectToId?: string;
  reason: string;
}

/** A suggested connection between two existing blocks. */
export interface GhostEdge {
  kind: 'edge';
  id: string;
  fromId: string;
  toId: string;
  reason: string;
}

export type GhostSuggestion = GhostNode | GhostEdge;

const BOUNDS = { minX: 76, maxX: 924, minY: 76, maxY: 484 };
const CLEAR_X = 150;
const CLEAR_Y = 100;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const laneY = (type: SystemNodeType) => {
  const lane = resolveSystemNodeVisual(type).lane;
  const index = SYSTEM_CANVAS_LANES.findIndex((item) => item.id === lane);
  return 70 + Math.max(0, index) * 140;
};

/**
 * The first spot near (x, y) that does not overlap a block or an earlier
 * ghost: tries the point itself, then steps down and up a lane, then sideways.
 */
export function freeSpot(
  x: number,
  y: number,
  occupied: Array<{ x: number; y: number }>,
): { x: number; y: number } {
  const offsets = [
    [0, 0],
    [0, 130],
    [0, -130],
    [0, 260],
    [0, -260],
    [160, 0],
    [-160, 0],
    [160, 130],
    [-160, 130],
    [160, -130],
    [-160, -130],
  ];
  for (const [dx, dy] of offsets) {
    const candidate = {
      x: clamp(Math.round(x + dx), BOUNDS.minX, BOUNDS.maxX),
      y: clamp(Math.round(y + dy), BOUNDS.minY, BOUNDS.maxY),
    };
    const clear = occupied.every(
      (point) =>
        Math.abs(point.x - candidate.x) >= CLEAR_X ||
        Math.abs(point.y - candidate.y) >= CLEAR_Y,
    );
    if (clear) return candidate;
  }
  return {
    x: clamp(Math.round(x), BOUNDS.minX, BOUNDS.maxX),
    y: clamp(Math.round(y), BOUNDS.minY, BOUNDS.maxY),
  };
}

const humanize = (type: string) => type.replaceAll('-', ' ');

/**
 * Turns what the current flow is missing, plus failed "add a block" rubric
 * rules from the latest evaluation, into at most `limit` ghosts.
 */
export function suggestGhosts(
  graph: SystemDesignGraph,
  missing: MissingFlowPart | undefined,
  failedRules: SystemRubricRule[] = [],
  limit = 3,
): GhostSuggestion[] {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const occupied = graph.nodes.map((node) => ({ x: node.x, y: node.y }));
  const ghosts: GhostSuggestion[] = [];
  const suggestedTypes = new Set<SystemNodeType>();

  if (missing?.kind === 'edge') {
    if (nodes.has(missing.fromId) && nodes.has(missing.toId))
      ghosts.push({
        kind: 'edge',
        id: `ghost-edge-${missing.fromId}-${missing.toId}`,
        fromId: missing.fromId,
        toId: missing.toId,
        reason: 'This flow needs this connection.',
      });
  } else if (missing?.kind === 'node') {
    const after = missing.afterId ? nodes.get(missing.afterId) : undefined;
    const before = missing.beforeId ? nodes.get(missing.beforeId) : undefined;
    const anchor =
      after && before
        ? { x: (after.x + before.x) / 2, y: (after.y + before.y) / 2 }
        : after
          ? { x: after.x + 180, y: after.y }
          : before
            ? { x: before.x - 180, y: before.y }
            : { x: 500, y: laneY(missing.nodeType) };
    const spot = freeSpot(anchor.x, anchor.y, occupied);
    occupied.push(spot);
    suggestedTypes.add(missing.nodeType);
    ghosts.push({
      kind: 'node',
      id: `ghost-${missing.nodeType}`,
      nodeType: missing.nodeType,
      ...spot,
      connectFromId: after?.id,
      connectToId: before?.id,
      reason: `The flow needs a ${humanize(missing.nodeType)} block here.`,
    });
  }

  for (const rule of failedRules) {
    if (ghosts.length >= limit) break;
    const check = rule.check;
    if (check.kind !== 'node-present' && check.kind !== 'node-count') continue;
    const have = graph.nodes.filter(
      (node) => node.type === check.nodeType,
    ).length;
    if (have >= (check.minCount ?? 1) || suggestedTypes.has(check.nodeType))
      continue;
    const spot = freeSpot(500, laneY(check.nodeType), occupied);
    occupied.push(spot);
    suggestedTypes.add(check.nodeType);
    ghosts.push({
      kind: 'node',
      id: `ghost-${check.nodeType}`,
      nodeType: check.nodeType,
      ...spot,
      reason: rule.failure,
    });
  }
  return ghosts.slice(0, limit);
}
