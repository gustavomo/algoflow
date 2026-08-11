import {
  SYSTEM_NODE_TYPES,
  type DesignProposal,
  type GraphPatchOperation,
  type SystemDesignEvaluation,
  type SystemDesignGraph,
  type SystemDesignScenario,
  type SystemFlowStep,
  type SystemNodeType,
} from '@algoflow/contracts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function validateSystemGraph(graph: unknown) {
  const errors: string[] = [];
  if (
    !isRecord(graph) ||
    !Array.isArray(graph.nodes) ||
    !Array.isArray(graph.edges)
  )
    return ['Graph must contain node and edge arrays.'];
  if (graph.nodes.length > 30)
    errors.push('A graph may contain at most 30 nodes.');
  if (graph.edges.length > 60)
    errors.push('A graph may contain at most 60 edges.');
  const nodeIds = new Set<string>();
  for (const candidate of graph.nodes) {
    if (!isRecord(candidate)) {
      errors.push('Graph contains an invalid node.');
      continue;
    }
    const node = candidate;
    const id = typeof node.id === 'string' ? node.id : '';
    if (!id || id.length > 80 || nodeIds.has(id))
      errors.push(`Invalid or duplicate node ID: ${id || 'missing'}`);
    nodeIds.add(id);
    if (
      typeof node.type !== 'string' ||
      !SYSTEM_NODE_TYPES.includes(node.type as SystemNodeType)
    )
      errors.push(`Unsupported node type: ${String(node.type)}`);
    if (
      typeof node.label !== 'string' ||
      !node.label.trim() ||
      node.label.length > 80
    )
      errors.push(`Invalid label for node ${id || 'missing'}`);
    if (
      typeof node.x !== 'number' ||
      typeof node.y !== 'number' ||
      !Number.isFinite(node.x) ||
      !Number.isFinite(node.y) ||
      node.x < 0 ||
      node.x > 1000 ||
      node.y < 0 ||
      node.y > 560
    )
      errors.push(`Node ${id || 'missing'} is outside the canvas.`);
    if (!isRecord(node.config) || Object.keys(node.config).length > 12)
      errors.push(`Invalid configuration for node ${id || 'missing'}`);
  }
  const edgeIds = new Set<string>();
  const pairs = new Set<string>();
  for (const candidate of graph.edges) {
    if (!isRecord(candidate)) {
      errors.push('Graph contains an invalid edge.');
      continue;
    }
    const edge = candidate;
    const id = typeof edge.id === 'string' ? edge.id : '';
    const from = typeof edge.from === 'string' ? edge.from : '';
    const to = typeof edge.to === 'string' ? edge.to : '';
    const pair = `${from}->${to}`;
    if (!id || id.length > 80 || edgeIds.has(id))
      errors.push(`Invalid or duplicate edge ID: ${id || 'missing'}`);
    edgeIds.add(id);
    if (!nodeIds.has(from) || !nodeIds.has(to))
      errors.push(`Edge ${id || 'missing'} is dangling.`);
    if (from && from === to)
      errors.push(`Edge ${id || 'missing'} cannot connect a node to itself.`);
    if (pairs.has(pair)) errors.push(`Duplicate connection: ${pair}`);
    pairs.add(pair);
  }
  return Array.from(new Set(errors));
}

export function applyGraphPatch(graph: SystemDesignGraph, operations: unknown) {
  if (
    !Array.isArray(operations) ||
    operations.length === 0 ||
    operations.length > 12
  )
    return { errors: ['A proposal must contain 1 to 12 operations.'] };
  const graphErrors = validateSystemGraph(graph);
  if (graphErrors.length) return { errors: graphErrors };
  const next: SystemDesignGraph = structuredClone(graph);
  for (const candidate of operations) {
    if (!isRecord(candidate) || typeof candidate.op !== 'string')
      return { errors: ['Proposal contains an invalid operation.'] };
    const operation = candidate;
    if (operation.op === 'add-node') {
      if (!isRecord(operation.node))
        return { errors: ['Proposal contains an invalid add-node operation.'] };
      next.nodes.push(
        operation.node as unknown as SystemDesignGraph['nodes'][number],
      );
    } else if (operation.op === 'update-node') {
      if (typeof operation.nodeId !== 'string' || !isRecord(operation.changes))
        return {
          errors: ['Proposal contains an invalid update-node operation.'],
        };
      const node = next.nodes.find(
        (candidate) => candidate.id === operation.nodeId,
      );
      if (!node) return { errors: [`Unknown node ${operation.nodeId}.`] };
      if (operation.changes.label != null) {
        if (typeof operation.changes.label !== 'string')
          return { errors: ['A node label must be text.'] };
        node.label = operation.changes.label;
      }
      if (operation.changes.config != null) {
        if (!isRecord(operation.changes.config))
          return { errors: ['Node configuration must be an object.'] };
        node.config = {
          ...node.config,
          ...operation.changes.config,
        } as SystemDesignGraph['nodes'][number]['config'];
      }
    } else if (operation.op === 'remove-node') {
      if (typeof operation.nodeId !== 'string')
        return {
          errors: ['Proposal contains an invalid remove-node operation.'],
        };
      next.nodes = next.nodes.filter((node) => node.id !== operation.nodeId);
      next.edges = next.edges.filter(
        (edge) =>
          edge.from !== operation.nodeId && edge.to !== operation.nodeId,
      );
    } else if (operation.op === 'add-edge') {
      if (!isRecord(operation.edge))
        return { errors: ['Proposal contains an invalid add-edge operation.'] };
      next.edges.push(
        operation.edge as unknown as SystemDesignGraph['edges'][number],
      );
    } else if (operation.op === 'remove-edge') {
      if (typeof operation.edgeId !== 'string')
        return {
          errors: ['Proposal contains an invalid remove-edge operation.'],
        };
      next.edges = next.edges.filter((edge) => edge.id !== operation.edgeId);
    } else return { errors: ['Proposal contains an unsupported operation.'] };
  }
  const errors = validateSystemGraph(next);
  return errors.length ? { errors } : { graph: next };
}

function nodesOfType(graph: SystemDesignGraph, type: SystemNodeType) {
  return graph.nodes.filter((node) => node.type === type);
}
function hasEdge(
  graph: SystemDesignGraph,
  fromType: SystemNodeType,
  toType: SystemNodeType,
) {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  return graph.edges.some(
    (edge) =>
      nodes.get(edge.from)?.type === fromType &&
      nodes.get(edge.to)?.type === toType,
  );
}
function pathExists(
  graph: SystemDesignGraph,
  fromType: SystemNodeType,
  toType: SystemNodeType,
) {
  const targets = new Set(nodesOfType(graph, toType).map((node) => node.id));
  const queue = nodesOfType(graph, fromType).map((node) => node.id);
  const visited = new Set(queue);
  while (queue.length) {
    const current = queue.shift()!;
    if (targets.has(current)) return true;
    for (const edge of graph.edges.filter(
      (candidate) => candidate.from === current,
    )) {
      if (!visited.has(edge.to)) {
        visited.add(edge.to);
        queue.push(edge.to);
      }
    }
  }
  return false;
}

export function evaluateSystemDesign(
  scenario: SystemDesignScenario,
  graph: SystemDesignGraph,
  tradeOffs: string,
): SystemDesignEvaluation {
  const errors = validateSystemGraph(graph);
  if (errors.length) throw new Error(errors.join(' '));
  const evidence = scenario.rubric.map((rule) => {
    const check = rule.check;
    let passed = false;
    if (check.kind === 'node-present')
      passed =
        nodesOfType(graph, check.nodeType).length >= (check.minCount ?? 1);
    else if (check.kind === 'edge-present')
      passed = hasEdge(graph, check.fromType, check.toType);
    else if (check.kind === 'path-exists')
      passed = pathExists(graph, check.fromType, check.toType);
    else if (check.kind === 'config-truthy')
      passed = nodesOfType(graph, check.nodeType).some((node) =>
        Boolean(node.config[check.key]),
      );
    else passed = tradeOffs.trim().length >= check.minLength;
    return {
      ruleId: rule.id,
      conceptId: rule.conceptId,
      title: rule.title,
      category: rule.category,
      weight: rule.weight,
      passed,
      evidence: passed ? rule.success : rule.failure,
    };
  });
  const total = evidence.reduce((sum, item) => sum + item.weight, 0);
  const earned = evidence
    .filter((item) => item.passed)
    .reduce((sum, item) => sum + item.weight, 0);
  const score = total ? Math.round((earned / total) * 100) : 0;
  return { score, passed: score >= 70, evidence };
}

export function generateSystemFlow(
  scenario: SystemDesignScenario,
  graph: SystemDesignGraph,
  flowId: string,
): { steps?: SystemFlowStep[]; error?: string } {
  const template = scenario.flows.find((flow) => flow.id === flowId);
  if (!template) return { error: 'Flow is not available.' };
  const chosen = template.nodeTypes.map((type) => nodesOfType(graph, type)[0]);
  const missing = template.nodeTypes.find((_, index) => !chosen[index]);
  if (missing)
    return {
      error: `Add a ${missing.replaceAll('-', ' ')} block to run this flow.`,
    };
  const steps: SystemFlowStep[] = [];
  for (let index = 0; index < chosen.length; index += 1) {
    const current = chosen[index]!;
    const previous = chosen[index - 1];
    const connecting = previous
      ? graph.edges.find(
          (edge) => edge.from === previous.id && edge.to === current.id,
        )
      : undefined;
    if (previous && !connecting)
      return {
        error: `Connect ${previous.label} to ${current.label} to run this flow.`,
      };
    steps.push({
      nodeId: current.id,
      edgeId: connecting?.id,
      label: `${template.title} · ${index + 1}/${chosen.length}`,
      narration: template.narration[index] ?? `Flow reaches ${current.label}.`,
    });
  }
  return { steps };
}

export function validatedProposal(
  graph: SystemDesignGraph,
  operations: GraphPatchOperation[],
  rationale: string,
  provider: DesignProposal['provider'],
): DesignProposal | undefined {
  if (!rationale.trim() || rationale.length > 1200) return undefined;
  const result = applyGraphPatch(graph, operations);
  return result.graph
    ? {
        rationale: rationale.trim(),
        operations,
        previewGraph: result.graph,
        provider,
      }
    : undefined;
}
