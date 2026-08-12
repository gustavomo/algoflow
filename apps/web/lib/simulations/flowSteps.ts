import type {
  SystemDesignGraph,
  SystemDesignScenario,
  SystemFlowStep,
  SystemNodeType,
} from '@algoflow/contracts';

export function createSystemFlowSteps(
  scenario: SystemDesignScenario,
  graph: SystemDesignGraph,
  flowId: string,
): { steps: SystemFlowStep[]; error?: string } {
  const template = scenario.flows.find((flow) => flow.id === flowId);
  if (!template) return { steps: [], error: 'Flow is not available.' };
  const firstOfType = (type: SystemNodeType) =>
    graph.nodes.find((node) => node.type === type);
  const nodes = template.nodeTypes.map(firstOfType);
  const missingIndex = nodes.findIndex((node) => !node);
  if (missingIndex >= 0)
    return {
      steps: [],
      error: `Add a ${template.nodeTypes[missingIndex].replaceAll('-', ' ')} block to run this flow.`,
    };
  const steps: SystemFlowStep[] = [
    {
      nodeId: nodes[0]!.id,
      phase: 'initial',
      label: `${template.title} · ready`,
      narration: `The ${template.title.toLowerCase()} is ready before work crosses the first system boundary.`,
    },
  ];
  for (let index = 0; index < nodes.length; index += 1) {
    const current = nodes[index]!;
    const previous = nodes[index - 1];
    const edge = previous
      ? graph.edges.find(
          (candidate) =>
            candidate.from === previous.id && candidate.to === current.id,
        )
      : undefined;
    if (previous && !edge)
      return {
        steps: [],
        error: `Connect ${previous.label} to ${current.label} to run this flow.`,
      };
    steps.push({
      nodeId: current.id,
      edgeId: edge?.id,
      phase: 'transition',
      label: `${template.title} · ${index + 1}/${nodes.length}`,
      narration: template.narration[index] ?? `Flow reaches ${current.label}.`,
    });
  }
  steps.push({
    nodeId: nodes.at(-1)!.id,
    edgeId: steps.at(-1)?.edgeId,
    phase: 'terminal',
    label: `${template.title} · complete`,
    narration: `The representative ${template.kind.replaceAll('-', ' ')} flow reached its declared terminal boundary.`,
  });
  return { steps };
}
