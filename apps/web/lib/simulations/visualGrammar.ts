import type {
  SystemChallengeEffect,
  SystemEdge,
  SystemFlowKind,
  SystemNode,
  SystemNodeType,
  VisualStagePhase,
} from '@algoflow/contracts';

export type SystemNodeFamily =
  | 'endpoint'
  | 'network'
  | 'compute'
  | 'data'
  | 'messaging'
  | 'operations'
  | 'security'
  | 'migration';

export type SystemCanvasLane = 'edge' | 'compute' | 'state' | 'control';

export interface SystemNodeVisualSpec {
  type: string;
  family: SystemNodeFamily;
  lane: SystemCanvasLane;
  mark: string;
  meaning: string;
  anchorX: number;
  anchorY: number;
}

const nodeVisual = (
  type: SystemNodeType,
  family: SystemNodeFamily,
  lane: SystemCanvasLane,
  mark: string,
  meaning: string,
  anchorX = 40,
  anchorY = 34,
): SystemNodeVisualSpec => ({
  type,
  family,
  lane,
  mark,
  meaning,
  anchorX,
  anchorY,
});

export const SYSTEM_NODE_VISUALS = {
  client: nodeVisual(
    'client',
    'endpoint',
    'edge',
    'UI',
    'Request origin and human-facing boundary',
    46,
    31,
  ),
  dns: nodeVisual(
    'dns',
    'network',
    'edge',
    'DNS',
    'Hierarchical name resolution',
    34,
    34,
  ),
  cdn: nodeVisual(
    'cdn',
    'network',
    'edge',
    'CDN',
    'Distributed edge delivery and caching',
    40,
    35,
  ),
  'load-balancer': nodeVisual(
    'load-balancer',
    'network',
    'compute',
    'LB',
    'Traffic distribution boundary',
    41,
    34,
  ),
  'api-gateway': nodeVisual(
    'api-gateway',
    'network',
    'compute',
    'API',
    'Policy and request routing gateway',
    38,
    34,
  ),
  service: nodeVisual(
    'service',
    'compute',
    'compute',
    'SVC',
    'Synchronous application capability',
    39,
    34,
  ),
  cache: nodeVisual(
    'cache',
    'data',
    'state',
    'RAM',
    'Low-latency temporary state',
    44,
    32,
  ),
  'relational-database': nodeVisual(
    'relational-database',
    'data',
    'state',
    'SQL',
    'Relational durable state',
    38,
    36,
  ),
  'document-database': nodeVisual(
    'document-database',
    'data',
    'state',
    'DOC',
    'Document-oriented durable state',
    40,
    36,
  ),
  'object-storage': nodeVisual(
    'object-storage',
    'data',
    'state',
    'OBJ',
    'Blob and asset storage',
    42,
    35,
  ),
  queue: nodeVisual(
    'queue',
    'messaging',
    'state',
    'Q',
    'Buffered asynchronous work',
    44,
    30,
  ),
  stream: nodeVisual(
    'stream',
    'messaging',
    'state',
    'EVT',
    'Ordered event flow',
    45,
    31,
  ),
  worker: nodeVisual(
    'worker',
    'compute',
    'compute',
    'WRK',
    'Asynchronous compute consumer',
    38,
    35,
  ),
  search: nodeVisual(
    'search',
    'data',
    'state',
    'IDX',
    'Indexed retrieval boundary',
    38,
    35,
  ),
  observability: nodeVisual(
    'observability',
    'operations',
    'control',
    'OBS',
    'Metrics, logs, and traces',
    43,
    32,
  ),
  'legacy-system': nodeVisual(
    'legacy-system',
    'migration',
    'control',
    'OLD',
    'Existing system under change',
    41,
    35,
  ),
  proxy: nodeVisual(
    'proxy',
    'network',
    'compute',
    'PXY',
    'Traffic interception and forwarding',
    39,
    34,
  ),
  'database-replica': nodeVisual(
    'database-replica',
    'data',
    'state',
    'RPL',
    'Replicated database copy',
    43,
    37,
  ),
  'change-data-capture': nodeVisual(
    'change-data-capture',
    'migration',
    'control',
    'CDC',
    'Incremental data-change transport',
    43,
    34,
  ),
  'feature-flag': nodeVisual(
    'feature-flag',
    'migration',
    'control',
    'FLAG',
    'Reversible traffic or capability switch',
    38,
    36,
  ),
  backup: nodeVisual(
    'backup',
    'operations',
    'control',
    'BAK',
    'Recoverable point-in-time copy',
    39,
    36,
  ),
  firewall: nodeVisual(
    'firewall',
    'security',
    'control',
    'FW',
    'Network policy boundary',
    39,
    37,
  ),
  'identity-provider': nodeVisual(
    'identity-provider',
    'security',
    'control',
    'ID',
    'Authentication and identity authority',
    38,
    36,
  ),
  scheduler: nodeVisual(
    'scheduler',
    'operations',
    'control',
    'TIME',
    'Time-triggered orchestration',
    37,
    37,
  ),
  'data-warehouse': nodeVisual(
    'data-warehouse',
    'data',
    'state',
    'DWH',
    'Analytical consolidated state',
    43,
    37,
  ),
  'dead-letter-queue': nodeVisual(
    'dead-letter-queue',
    'messaging',
    'state',
    'DLQ',
    'Isolated failed asynchronous work',
    45,
    32,
  ),
} satisfies Record<SystemNodeType, SystemNodeVisualSpec>;

const fallbackNodeVisual: SystemNodeVisualSpec = {
  type: 'unknown',
  family: 'operations',
  lane: 'control',
  mark: '?',
  meaning: 'Unknown infrastructure type',
  anchorX: 38,
  anchorY: 34,
};

export function resolveSystemNodeVisual(type: string): SystemNodeVisualSpec {
  return (
    (SYSTEM_NODE_VISUALS as Record<string, SystemNodeVisualSpec>)[type] ??
    fallbackNodeVisual
  );
}

export const SYSTEM_CANVAS_LANES = [
  {
    id: 'edge' as const,
    label: 'Request / edge',
    detail: 'entry, resolution, delivery',
  },
  {
    id: 'compute' as const,
    label: 'Compute / routing',
    detail: 'policy, services, workers',
  },
  {
    id: 'state' as const,
    label: 'Data / messaging',
    detail: 'state, queues, replication',
  },
  {
    id: 'control' as const,
    label: 'Control / recovery',
    detail: 'observe, secure, migrate',
  },
] as const;

export type SystemEdgeVisualClass =
  | 'request'
  | 'cache'
  | 'data'
  | 'async'
  | 'replication'
  | 'observability'
  | 'control'
  | 'failure'
  | 'recovery';

export interface SystemEdgeVisualSpec {
  label: string;
  dasharray?: string;
  width: number;
  token: 'circle' | 'square' | 'diamond' | 'double' | 'cross';
}

export const SYSTEM_EDGE_VISUALS: Record<
  SystemEdgeVisualClass,
  SystemEdgeVisualSpec
> = {
  request: { label: 'request', width: 2.2, token: 'circle' },
  cache: { label: 'cache', dasharray: '2 6', width: 2.4, token: 'square' },
  data: { label: 'data', dasharray: '11 4', width: 2.6, token: 'diamond' },
  async: { label: 'async', dasharray: '1 7', width: 3, token: 'double' },
  replication: {
    label: 'replication',
    dasharray: '12 3 2 3',
    width: 2.8,
    token: 'double',
  },
  observability: {
    label: 'telemetry',
    dasharray: '3 4',
    width: 1.8,
    token: 'diamond',
  },
  control: {
    label: 'control',
    dasharray: '8 4',
    width: 2.2,
    token: 'square',
  },
  failure: {
    label: 'failure',
    dasharray: '5 4',
    width: 3.4,
    token: 'cross',
  },
  recovery: {
    label: 'recovery',
    dasharray: '14 3',
    width: 3.2,
    token: 'diamond',
  },
};

export type ActiveSystemFlow = SystemFlowKind | SystemChallengeEffect;

const dataTypes = new Set<string>([
  'cache',
  'relational-database',
  'document-database',
  'object-storage',
  'database-replica',
  'backup',
  'data-warehouse',
  'search',
]);
const asyncTypes = new Set<string>([
  'queue',
  'stream',
  'dead-letter-queue',
  'change-data-capture',
]);
const operationsTypes = new Set<string>(['observability']);

function classForActiveFlow(
  activeFlow: ActiveSystemFlow | undefined,
): SystemEdgeVisualClass | undefined {
  if (!activeFlow) return undefined;
  if (activeFlow === 'request') return 'request';
  if (activeFlow === 'cache') return 'cache';
  if (activeFlow === 'write' || activeFlow === 'stale-read') return 'data';
  if (activeFlow === 'async-job' || activeFlow === 'queue-pressure')
    return 'async';
  if (activeFlow === 'replication') return 'replication';
  if (activeFlow === 'failure' || activeFlow === 'availability-loss')
    return 'failure';
  if (activeFlow === 'recovery' || activeFlow === 'recovery-path')
    return 'recovery';
  return 'control';
}

export function classifySystemEdge(
  edge: SystemEdge,
  from: SystemNode,
  to: SystemNode,
  activeFlow?: ActiveSystemFlow,
  phase?: VisualStagePhase,
): SystemEdgeVisualClass {
  if (phase === 'failure') return 'failure';
  if (phase === 'recovery') return 'recovery';
  const activeClass = classForActiveFlow(activeFlow);
  if (activeClass) return activeClass;

  const label = edge.label?.toLocaleLowerCase() ?? '';
  if (/cache|hit|miss|ttl/.test(label)) return 'cache';
  if (/replica|replication|mirror|sync|cdc/.test(label)) return 'replication';
  if (/metric|trace|log|telemetry|observe/.test(label)) return 'observability';
  if (/queue|event|async|stream|job|dead.?letter/.test(label)) return 'async';
  if (/fail|timeout|outage|error/.test(label)) return 'failure';
  if (/recover|restore|fallback|rollback/.test(label)) return 'recovery';
  if (/validate|cutover|decommission|flag|auth|tls|policy/.test(label))
    return 'control';
  if (/read|write|query|sql|object|storage|data/.test(label)) return 'data';
  if (operationsTypes.has(from.type) || operationsTypes.has(to.type))
    return 'observability';
  if (asyncTypes.has(from.type) || asyncTypes.has(to.type)) return 'async';
  if (dataTypes.has(from.type) || dataTypes.has(to.type)) return 'data';
  return 'request';
}

export interface SystemPhaseVisual {
  label: string;
  symbol: string;
  dasharray?: string;
}

export const SYSTEM_PHASE_VISUALS: Record<VisualStagePhase, SystemPhaseVisual> =
  {
    initial: { label: 'ready', symbol: '○', dasharray: '2 5' },
    transition: { label: 'in flight', symbol: '→' },
    failure: { label: 'failed boundary', symbol: '×', dasharray: '5 4' },
    recovery: { label: 'recovery route', symbol: '↺', dasharray: '12 3' },
    terminal: { label: 'terminal state', symbol: '✓' },
  };

/**
 * How much to enlarge canvas text so a label drawn at `baseUnits` stays at
 * least `minPx` on screen when the 1000-unit canvas renders at `scale` px per
 * unit (about 0.36 on a 390px phone). 1 means no change.
 */
export function systemLabelScale(scale: number, minPx = 12, baseUnits = 13) {
  if (!(scale > 0)) return 1;
  return Math.max(1, minPx / (baseUnits * scale));
}

/** Characters a node label keeps at a label scale before truncating. */
export function systemLabelLimit(labelScale: number) {
  return Math.max(8, Math.floor(20 / labelScale + 0.5) + 2);
}

export function truncateSystemLabel(label: string, max = 20) {
  if (label.length <= max) return label;
  return `${label.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

export interface SystemPoint {
  x: number;
  y: number;
}

export interface SystemEdgeGeometry {
  start: SystemPoint;
  control: SystemPoint;
  middle: SystemPoint;
  end: SystemPoint;
  label: SystemPoint;
  path: string;
}

function ellipseAnchor(
  node: SystemNode,
  target: SystemNode,
  spec: SystemNodeVisualSpec,
): SystemPoint {
  const dx = target.x - node.x;
  const dy = target.y - node.y;
  if (!dx && !dy) return { x: node.x, y: node.y - spec.anchorY };
  const scale =
    1 /
    Math.sqrt(
      (dx * dx) / (spec.anchorX * spec.anchorX) +
        (dy * dy) / (spec.anchorY * spec.anchorY),
    );
  return { x: node.x + dx * scale, y: node.y + dy * scale };
}

function quadraticPoint(
  start: SystemPoint,
  control: SystemPoint,
  end: SystemPoint,
  t: number,
): SystemPoint {
  const inverse = 1 - t;
  return {
    x:
      inverse * inverse * start.x + 2 * inverse * t * control.x + t * t * end.x,
    y:
      inverse * inverse * start.y + 2 * inverse * t * control.y + t * t * end.y,
  };
}

export function buildSystemEdgeGeometry(
  from: SystemNode,
  to: SystemNode,
  parallelIndex = 0,
  parallelCount = 1,
): SystemEdgeGeometry {
  const fromVisual = resolveSystemNodeVisual(from.type);
  const toVisual = resolveSystemNodeVisual(to.type);
  if (from.id === to.id) {
    const start = { x: from.x + 16, y: from.y - fromVisual.anchorY };
    const end = { x: from.x - 16, y: from.y - fromVisual.anchorY };
    const control = { x: from.x, y: from.y - 96 };
    const middle = quadraticPoint(start, control, end, 0.5);
    return {
      start,
      control,
      middle,
      end,
      label: { x: middle.x, y: middle.y - 10 },
      path: `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`,
    };
  }

  const start = ellipseAnchor(from, to, fromVisual);
  const end = ellipseAnchor(to, from, toVisual);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const offset = (parallelIndex - (parallelCount - 1) / 2) * 24;
  const stableDirection = from.id.localeCompare(to.id) <= 0 ? 1 : -1;
  const normalX = (-dy / length) * stableDirection;
  const normalY = (dx / length) * stableDirection;
  const control = {
    x: (start.x + end.x) / 2 + normalX * offset,
    y: (start.y + end.y) / 2 + normalY * offset,
  };
  const middle = quadraticPoint(start, control, end, 0.5);
  return {
    start,
    control,
    middle,
    end,
    label: {
      x: middle.x + normalX * 11,
      y: middle.y + normalY * 11 - 7,
    },
    path: `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`,
  };
}

export function parallelEdgePosition(edges: SystemEdge[], edge: SystemEdge) {
  const pair = [edge.from, edge.to].sort().join('::');
  const siblings = edges
    .filter(
      (candidate) => [candidate.from, candidate.to].sort().join('::') === pair,
    )
    .sort((left, right) => left.id.localeCompare(right.id));
  return {
    index: Math.max(
      0,
      siblings.findIndex((candidate) => candidate.id === edge.id),
    ),
    count: Math.max(1, siblings.length),
  };
}
