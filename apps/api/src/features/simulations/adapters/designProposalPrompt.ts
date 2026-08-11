import {
  SYSTEM_NODE_CONFIG_KEYS,
  SYSTEM_NODE_TYPES,
} from '@algoflow/contracts';
import type { ProposalInput } from '../ports/designProposalProvider';
import type { ProposalOutput } from '../ports/designProposalProvider';

export const DESIGN_PROPOSAL_INSTRUCTION =
  'Return raw JSON with rationale and operations only. Every operation MUST use the field "op" (never "operation"). Exact shapes: {"op":"add-node","node":{...}}, {"op":"update-node","nodeId":"...","changes":{...}}, {"op":"remove-node","nodeId":"..."}, {"op":"add-edge","edge":{...}}, or {"op":"remove-edge","edgeId":"..."}. Use existing IDs or new IDs prefixed suggested-. Never include Markdown, code, infrastructure commands, or commentary outside the JSON object.';

export function parseDesignProposalOutput(content: string): ProposalOutput {
  const parsed: unknown = JSON.parse(content);
  if (!parsed || typeof parsed !== 'object')
    throw new Error('Provider returned an invalid proposal object.');
  const candidate = parsed as {
    rationale?: unknown;
    operations?: unknown;
  };
  if (
    typeof candidate.rationale !== 'string' ||
    !Array.isArray(candidate.operations)
  ) {
    throw new Error('Provider returned an invalid proposal contract.');
  }
  const operations = candidate.operations.map((operation) => {
    if (!operation || typeof operation !== 'object') return operation;
    const record = operation as Record<string, unknown>;
    if (typeof record.op === 'string' || typeof record.operation !== 'string')
      return operation;
    const { operation: alias, ...rest } = record;
    return { ...rest, op: alias };
  });
  return {
    rationale: candidate.rationale,
    operations: operations as ProposalOutput['operations'],
  };
}

export function designProposalContext({
  scenario,
  graph,
  question,
  phase,
}: ProposalInput) {
  return {
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
    question: question ?? 'Improve the highest-priority missing requirement.',
  };
}

export function designProposalCliPrompt(input: ProposalInput) {
  return `${DESIGN_PROPOSAL_INSTRUCTION}\n\nDesign context:\n${JSON.stringify(designProposalContext(input))}`;
}
