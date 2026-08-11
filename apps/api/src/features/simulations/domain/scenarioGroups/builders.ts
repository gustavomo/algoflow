import type {
  SystemEdge,
  SystemFlowTemplate,
  SystemNode,
  SystemNodeType,
  SystemRubricCheck,
  SystemRubricRule,
  SystemScenarioPhase,
} from '@algoflow/contracts';

export const node = (
  id: string,
  type: SystemNodeType,
  label: string,
  x: number,
  y: number,
  config: SystemNode['config'] = {},
): SystemNode => ({ id, type, label, x, y, config });

export const edge = (
  id: string,
  from: string,
  to: string,
  label?: string,
): SystemEdge => ({ id, from, to, label });

export function flow(
  id: string,
  title: string,
  kind: SystemFlowTemplate['kind'],
  nodeTypes: SystemNodeType[],
  narration: string[],
): SystemFlowTemplate {
  return { id, title, kind, nodeTypes, narration };
}

export function rule(input: {
  id: string;
  conceptId: string;
  title: string;
  category: SystemRubricRule['category'];
  check: SystemRubricCheck;
  success: string;
  failure: string;
  weight?: number;
}): SystemRubricRule {
  return {
    ...input,
    weight: input.weight ?? 20,
    reviewPrompt: `Why does “${input.title}” matter in this design?`,
    reviewAnswer: input.success,
  };
}

export function migrationPhases(): SystemScenarioPhase[] {
  return [
    {
      id: 'prepare',
      title: '1. Prepare',
      goal: 'Introduce the destination and compatibility boundary without moving production authority.',
      flowIds: ['prepare'],
      gate: 'Destination health and rollback ownership are observable before data or traffic moves.',
    },
    {
      id: 'validate',
      title: '2. Validate',
      goal: 'Copy or mirror behavior and compare results while the legacy path remains authoritative.',
      flowIds: ['validate'],
      gate: 'Reconciliation and service-level signals meet the agreed threshold.',
    },
    {
      id: 'cutover',
      title: '3. Cut over',
      goal: 'Shift a bounded share of production authority to the destination.',
      flowIds: ['cutover'],
      gate: 'The destination sustains the target load and correctness window.',
    },
    {
      id: 'rollback',
      title: '4. Roll back',
      goal: 'Exercise the safe path back before the legacy system is removed.',
      flowIds: ['rollback'],
      gate: 'Rollback restores authority without losing accepted work.',
    },
    {
      id: 'decommission',
      title: '5. Decommission',
      goal: 'Remove compatibility mechanisms only after the stability window closes.',
      flowIds: ['decommission'],
      gate: 'No production dependency or recovery obligation still requires the legacy path.',
    },
  ];
}
