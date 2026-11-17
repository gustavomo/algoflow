import type {
  SystemChallengeStep,
  SystemDesignGraph,
  SystemFlowStep,
  SystemNode,
  SystemNodeType,
} from '@algoflow/contracts';
import {
  buildSystemEdgeGeometry,
  parallelEdgePosition,
  type SystemPoint,
} from './visualGrammar';

/**
 * How the request token reads at one step: neutral while in flight, hit or
 * miss at a cache boundary, warn on an elevated metric, error on a failed
 * boundary or a critical metric, done at the terminal step.
 */
export type TraceTone = 'neutral' | 'hit' | 'miss' | 'warn' | 'error' | 'done';

export const TRACE_TONE_VAR: Record<TraceTone, string> = {
  neutral: '--color-ink',
  hit: '--color-success',
  miss: '--color-warning',
  warn: '--color-warning',
  error: '--color-danger',
  done: '--color-success',
};

/**
 * Educational per-hop cost in milliseconds: the time a request spends inside
 * a boundary of this type plus the network hop to reach it. Deterministic so
 * the same topology always tells the same latency story.
 */
export const NODE_LATENCY_MS: Record<SystemNodeType, number> = {
  client: 0,
  dns: 20,
  cdn: 12,
  'load-balancer': 2,
  'api-gateway': 6,
  service: 15,
  cache: 2,
  'relational-database': 25,
  'document-database': 20,
  'object-storage': 40,
  queue: 4,
  stream: 5,
  worker: 30,
  search: 18,
  observability: 3,
  'legacy-system': 60,
  proxy: 3,
  'database-replica': 22,
  'change-data-capture': 8,
  'feature-flag': 2,
  backup: 50,
  firewall: 2,
  'identity-provider': 25,
  scheduler: 5,
  'data-warehouse': 80,
  'dead-letter-queue': 4,
};
export const NETWORK_HOP_MS = 4;

const CACHE_TYPES = new Set<SystemNodeType>(['cache', 'cdn']);

export interface TraceFrame {
  nodeId: string;
  /** Node the token travelled from to reach this step, if it moved. */
  fromNodeId?: string;
  edgeId?: string;
  tone: TraceTone;
  hopMs: number;
  totalMs: number;
  caption: string;
}

type TraceStep = SystemFlowStep | SystemChallengeStep;

const metricOf = (step: TraceStep) =>
  'metric' in step && step.metric ? step.metric.replaceAll('-', ' ') : '';
const bandOf = (step: TraceStep) => ('band' in step ? step.band : undefined);

function findEdge(graph: SystemDesignGraph, from: string, to: string) {
  return (
    graph.edges.find((edge) => edge.from === from && edge.to === to) ??
    graph.edges.find((edge) => edge.from === to && edge.to === from)
  );
}

/** One frame per step: tone, accumulated latency and the action caption. */
export function buildFlowTrace(
  steps: TraceStep[],
  graph: SystemDesignGraph,
): TraceFrame[] {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const frames: TraceFrame[] = [];
  let totalMs = 0;
  let afterMiss = false;
  steps.forEach((step, index) => {
    const node = nodes.get(step.nodeId);
    const label = node?.label ?? step.nodeId;
    const previous = steps[index - 1];
    const fromNodeId =
      previous && previous.nodeId !== step.nodeId ? previous.nodeId : undefined;
    const edgeId =
      step.edgeId ??
      (fromNodeId ? findEdge(graph, fromNodeId, step.nodeId)?.id : undefined);
    const hopMs =
      fromNodeId && node ? NODE_LATENCY_MS[node.type] + NETWORK_HOP_MS : 0;
    totalMs += hopMs;
    const movesOn = steps
      .slice(index + 1)
      .some((later) => later.nodeId !== step.nodeId);
    const band = bandOf(step);
    const metric = metricOf(step);
    let tone: TraceTone = 'neutral';
    let caption = `→ ${label} +${hopMs}ms · ${totalMs}ms`;
    if (step.phase === 'failure' || band === 'critical') {
      tone = 'error';
      caption = `${label} ✕ ${metric || 'failed'} · ${totalMs}ms`;
    } else if (step.phase === 'terminal') {
      tone = 'done';
      caption = `✓ complete · ${totalMs}ms`;
    } else if (step.phase === 'initial') {
      caption = `${label} · ready · 0ms`;
    } else if (step.phase === 'recovery') {
      tone = band === 'elevated' ? 'warn' : 'hit';
      caption = `${label} ↺ recovery · ${totalMs}ms`;
    } else if (node && CACHE_TYPES.has(node.type) && fromNodeId) {
      const word = node.type === 'cdn' ? 'edge' : 'cache';
      tone = movesOn ? 'miss' : 'hit';
      caption = movesOn
        ? `${word} miss → origin · ${totalMs}ms`
        : `${word} hit · ${totalMs}ms`;
    } else if (band === 'elevated') {
      tone = 'warn';
      caption = `${label} ${metric || 'pressure'} elevated · ${totalMs}ms`;
    } else if (!fromNodeId) {
      caption = `${label} sends · ${totalMs}ms`;
    } else if (afterMiss) {
      caption = `origin ${label} +${hopMs}ms · ${totalMs}ms`;
    }
    afterMiss = tone === 'miss' || (afterMiss && !fromNodeId);
    frames.push({
      nodeId: step.nodeId,
      fromNodeId,
      edgeId,
      tone,
      hopMs,
      totalMs,
      caption,
    });
  });
  return frames;
}

/** Where the token rests beside a node: its upper-right shoulder. */
export function tokenRestPoint(node: Pick<SystemNode, 'x' | 'y'>): SystemPoint {
  return { x: node.x + 50, y: node.y - 22 };
}

const quadratic = (
  start: SystemPoint,
  control: SystemPoint,
  end: SystemPoint,
  t: number,
): SystemPoint => {
  const inverse = 1 - t;
  return {
    x:
      inverse * inverse * start.x + 2 * inverse * t * control.x + t * t * end.x,
    y:
      inverse * inverse * start.y + 2 * inverse * t * control.y + t * t * end.y,
  };
};

/**
 * Keyframes for the token to reach `frame`: from the previous node's rest
 * point, along the drawn edge (either direction), to this node's rest point.
 * A frame that did not move is a single point.
 */
export function tokenTravel(
  frame: TraceFrame,
  graph: SystemDesignGraph,
  samples = 10,
): SystemPoint[] {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const target = nodes.get(frame.nodeId);
  if (!target) return [];
  const rest = tokenRestPoint(target);
  const origin = frame.fromNodeId ? nodes.get(frame.fromNodeId) : undefined;
  if (!origin) return [rest];
  const edge = frame.edgeId
    ? graph.edges.find((candidate) => candidate.id === frame.edgeId)
    : undefined;
  const from = edge ? nodes.get(edge.from) : undefined;
  const to = edge ? nodes.get(edge.to) : undefined;
  if (!edge || !from || !to) return [tokenRestPoint(origin), rest];
  const parallel = parallelEdgePosition(graph.edges, edge);
  const geometry = buildSystemEdgeGeometry(
    from,
    to,
    parallel.index,
    parallel.count,
  );
  const forward = edge.from === origin.id;
  const path = Array.from({ length: samples + 1 }, (_, index) =>
    quadratic(geometry.start, geometry.control, geometry.end, index / samples),
  );
  if (!forward) path.reverse();
  return [tokenRestPoint(origin), ...path, rest];
}
