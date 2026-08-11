import OpenAI from 'openai';
import {
  SYSTEM_NODE_CONFIG_KEYS,
  SYSTEM_NODE_TYPES,
} from '@algoflow/contracts';
import type { GraphPatchOperation, SystemNodeType } from '@algoflow/contracts';
import type { DesignProposalProvider } from '../ports/designProposalProvider';

function missing(
  graph: { nodes: { type: SystemNodeType }[] },
  type: SystemNodeType,
) {
  return !graph.nodes.some((node) => node.type === type);
}

function nodeId(
  graph: { nodes: { id: string; type: SystemNodeType }[] },
  type: SystemNodeType,
) {
  return graph.nodes.find((node) => node.type === type)?.id;
}

function hasConnection(
  graph: { edges: { from: string; to: string }[] },
  from: string,
  to: string,
) {
  return graph.edges.some((edge) => edge.from === from && edge.to === to);
}

export const mockDesignProposalProvider: DesignProposalProvider = {
  provider: 'mock',
  async propose({ scenario, graph, phase }) {
    let operations: GraphPatchOperation[] = [];
    let rationale =
      'Improve the highest-priority missing deterministic rubric boundary.';
    if (scenario.slug === 'global-cdn-delivery') {
      const cdnId = nodeId(graph, 'cdn') ?? 'suggested-cdn';
      if (missing(graph, 'cdn'))
        operations.push({
          op: 'add-node',
          node: {
            id: cdnId,
            type: 'cdn',
            label: 'CDN edge',
            x: 500,
            y: 220,
            config: { tls: true, cacheTtlSeconds: 3600 },
          },
        });
      else
        operations.push({
          op: 'update-node',
          nodeId: cdnId,
          changes: { config: { tls: true, cacheTtlSeconds: 3600 } },
        });
      if (graph.edges.some((edge) => edge.id === 'dns-origin'))
        operations.push({ op: 'remove-edge', edgeId: 'dns-origin' });
      if (!hasConnection(graph, 'dns-1', cdnId))
        operations.push({
          op: 'add-edge',
          edge: {
            id: 'dns-suggested-cdn',
            from: 'dns-1',
            to: cdnId,
            label: 'route',
          },
        });
      if (!hasConnection(graph, cdnId, 'origin-1'))
        operations.push({
          op: 'add-edge',
          edge: {
            id: 'suggested-cdn-origin',
            from: cdnId,
            to: 'origin-1',
            label: 'cache miss',
          },
        });
      rationale =
        'Route DNS through a TLS-enabled CDN and keep object storage as the cache-miss origin.';
    } else if (scenario.slug === 'url-shortener') {
      const cacheId = nodeId(graph, 'cache') ?? 'suggested-cache';
      const loadBalancerId = nodeId(graph, 'load-balancer') ?? 'suggested-lb';
      if (missing(graph, 'cache'))
        operations.push({
          op: 'add-node',
          node: {
            id: cacheId,
            type: 'cache',
            label: 'Redirect cache',
            x: 650,
            y: 390,
            config: { ttlSeconds: 300 },
          },
        });
      if (!hasConnection(graph, 'service-1', cacheId))
        operations.push({
          op: 'add-edge',
          edge: {
            id: 'service-suggested-cache',
            from: 'service-1',
            to: cacheId,
            label: 'hot lookup',
          },
        });
      if (!hasConnection(graph, cacheId, 'db-1'))
        operations.push({
          op: 'add-edge',
          edge: {
            id: 'suggested-cache-db',
            from: cacheId,
            to: 'db-1',
            label: 'cache miss',
          },
        });
      if (missing(graph, 'load-balancer'))
        operations.push({
          op: 'add-node',
          node: {
            id: loadBalancerId,
            type: 'load-balancer',
            label: 'Load balancer',
            x: 405,
            y: 100,
            config: { healthChecks: true },
          },
        });
      if (!hasConnection(graph, 'gateway-1', loadBalancerId))
        operations.push({
          op: 'add-edge',
          edge: {
            id: 'gateway-suggested-lb',
            from: 'gateway-1',
            to: loadBalancerId,
          },
        });
      if (!hasConnection(graph, loadBalancerId, 'service-1'))
        operations.push({
          op: 'add-edge',
          edge: {
            id: 'suggested-lb-service',
            from: loadBalancerId,
            to: 'service-1',
          },
        });
      operations.push({
        op: 'update-node',
        nodeId: 'service-1',
        changes: { config: { replicas: 3 } },
      });
      rationale =
        'Add read caching and horizontal service capacity while keeping the database authoritative.';
    } else if (scenario.slug === 'async-file-processing') {
      const queueId = nodeId(graph, 'queue') ?? 'suggested-queue';
      const workerId = nodeId(graph, 'worker') ?? 'suggested-worker';
      if (missing(graph, 'queue'))
        operations.push({
          op: 'add-node',
          node: {
            id: queueId,
            type: 'queue',
            label: 'Job queue',
            x: 500,
            y: 350,
            config: { durable: true },
          },
        });
      if (missing(graph, 'worker'))
        operations.push({
          op: 'add-node',
          node: {
            id: workerId,
            type: 'worker',
            label: 'File worker',
            x: 700,
            y: 350,
            config: { idempotent: true, replicas: 2 },
          },
        });
      if (!hasConnection(graph, 'gateway-1', queueId))
        operations.push({
          op: 'add-edge',
          edge: {
            id: 'gateway-suggested-queue',
            from: 'gateway-1',
            to: queueId,
            label: 'enqueue',
          },
        });
      if (!hasConnection(graph, queueId, workerId))
        operations.push({
          op: 'add-edge',
          edge: {
            id: 'suggested-queue-worker',
            from: queueId,
            to: workerId,
            label: 'consume',
          },
        });
      if (!hasConnection(graph, workerId, 'storage-1'))
        operations.push({
          op: 'add-edge',
          edge: {
            id: 'suggested-worker-storage',
            from: workerId,
            to: 'storage-1',
            label: 'read/write',
          },
        });
      rationale =
        'Move long processing behind a durable queue and idempotent worker while retaining object storage.';
    } else {
      const phaseFlowIds = phase ? new Set(phase.flowIds) : undefined;
      const candidateFlows = phaseFlowIds
        ? scenario.flows.filter((flow) => phaseFlowIds.has(flow.id))
        : scenario.flows;
      const firstFlow =
        candidateFlows.find((candidate) =>
          candidate.nodeTypes.some((type, index) => {
            const id = nodeId(graph, type);
            if (!id) return true;
            const previousType = candidate.nodeTypes[index - 1];
            if (!previousType) return false;
            const previousId = nodeId(graph, previousType);
            return !previousId || !hasConnection(graph, previousId, id);
          }),
        ) ?? candidateFlows[0];
      const ids = new Map<SystemNodeType, string>();
      for (const [index, type] of firstFlow.nodeTypes.entries()) {
        const existingId = nodeId(graph, type);
        const id =
          existingId ?? `suggested-${scenario.slug}-${type}`.slice(0, 80);
        ids.set(type, id);
        if (!existingId)
          operations.push({
            op: 'add-node',
            node: {
              id,
              type,
              label: type
                .replaceAll('-', ' ')
                .replace(/\b\w/g, (letter) => letter.toUpperCase()),
              x: 120 + index * Math.floor(760 / firstFlow.nodeTypes.length),
              y: 320,
              config: {},
            },
          });
      }
      for (let index = 1; index < firstFlow.nodeTypes.length; index += 1) {
        const from = ids.get(firstFlow.nodeTypes[index - 1])!;
        const to = ids.get(firstFlow.nodeTypes[index])!;
        if (!hasConnection(graph, from, to))
          operations.push({
            op: 'add-edge',
            edge: {
              id: `suggested-${index}-${from}-${to}`.slice(0, 80),
              from,
              to,
            },
          });
      }
      rationale = `Complete the ${firstFlow.title.toLowerCase()} path${phase ? ` for ${phase.title.toLowerCase()}` : ''} with the smallest valid topology patch.`;
    }
    return { rationale, operations };
  },
};

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : undefined;

export const openaiDesignProposalProvider: DesignProposalProvider = {
  provider: 'openai',
  async propose({ scenario, graph, question, phase }) {
    if (!openai) throw new Error('OpenAI is not configured.');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Return JSON with rationale and operations only. Operations may be add-node, update-node, remove-node, add-edge, or remove-edge. Use existing IDs or new IDs prefixed suggested-. Never include code or infrastructure commands.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            goal: scenario.goal,
            requirements: scenario.requirements,
            selectedPhase: phase
              ? {
                  id: phase.id,
                  goal: phase.goal,
                  gate: phase.gate,
                  allowedFlowIds: phase.flowIds,
                }
              : undefined,
            allowedNodeTypes: SYSTEM_NODE_TYPES,
            allowedConfigKeys: SYSTEM_NODE_CONFIG_KEYS,
            graph,
            question:
              question ?? 'Improve the highest-priority missing requirement.',
          }),
        },
      ],
    });
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Provider returned no proposal.');
    return JSON.parse(content) as {
      rationale: string;
      operations: GraphPatchOperation[];
    };
  },
};

export function getDesignProposalProvider() {
  return process.env.MOCK_AI === '1' || !process.env.OPENAI_API_KEY
    ? mockDesignProposalProvider
    : openaiDesignProposalProvider;
}
