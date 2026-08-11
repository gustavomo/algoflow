import {
  SYSTEM_CHALLENGE_EFFECTS,
  SYSTEM_CHALLENGE_METRICS,
  TUTOR_HELP_LEVELS,
  type SystemChallengeMetricName,
  type TutorOverlay,
  type TutorRequest,
  type TutorSceneContext,
} from '@algoflow/contracts';
import { lessonBySlug } from '../../catalog/domain/catalog';
import { getChallengeForScenario } from '../../simulations/domain/challenges';
import { scenarioBySlug } from '../../simulations/domain/scenarios';
import { validateSystemGraph } from '../../simulations/domain/systemDesign';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validString(value: unknown, maxLength: number) {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.length <= maxLength
  );
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: string[]) {
  const allowedSet = new Set(allowed);
  return Object.keys(value).every((key) => allowedSet.has(key));
}

export function parseTutorRequest(input: unknown): {
  value?: TutorRequest;
  error?: string;
} {
  if (!isRecord(input)) return { error: 'Tutor request must be an object.' };
  if (!hasOnlyKeys(input, ['question', 'helpLevel', 'context', 'citations']))
    return { error: 'Tutor request contains unsupported fields.' };
  if (!validString(input.question, 1_200))
    return {
      error: 'question is required and must be at most 1200 characters.',
    };
  if (!TUTOR_HELP_LEVELS.includes(input.helpLevel as never))
    return { error: 'helpLevel is not supported.' };
  if (!isRecord(input.context)) return { error: 'context is required.' };
  const context = input.context;
  if (context.kind === 'bubble-sort') {
    if (
      !hasOnlyKeys(context, [
        'kind',
        'lessonSlug',
        'phase',
        'items',
        'selectedItemIds',
        'predictedSwap',
        'predictionCorrect',
        'narration',
      ]) ||
      !validString(context.lessonSlug, 100) ||
      !lessonBySlug.has(String(context.lessonSlug)) ||
      !['predict', 'run', 'feedback', 'complete'].includes(
        String(context.phase),
      ) ||
      !Array.isArray(context.items) ||
      context.items.length < 2 ||
      context.items.length > 20
    )
      return { error: 'Bubble Sort context is invalid.' };
    const itemIds = new Set<string>();
    for (const item of context.items) {
      if (
        !isRecord(item) ||
        !hasOnlyKeys(item, ['id', 'value']) ||
        !validString(item.id, 80) ||
        !Number.isInteger(item.value) ||
        itemIds.has(item.id as string)
      )
        return { error: 'Bubble Sort items are invalid.' };
      itemIds.add(item.id as string);
    }
    if (
      !Array.isArray(context.selectedItemIds) ||
      context.selectedItemIds.length > 2 ||
      context.selectedItemIds.some(
        (itemId) => typeof itemId !== 'string' || !itemIds.has(itemId),
      ) ||
      !validString(context.narration, 1_200)
    )
      return { error: 'Bubble Sort selection context is invalid.' };
    if (
      (context.predictedSwap != null &&
        typeof context.predictedSwap !== 'boolean') ||
      (context.predictionCorrect != null &&
        typeof context.predictionCorrect !== 'boolean')
    )
      return { error: 'Bubble Sort prediction context is invalid.' };
  } else if (context.kind === 'design-lab') {
    if (
      !hasOnlyKeys(context, [
        'kind',
        'scenarioSlug',
        'phaseId',
        'graph',
        'selectedNodeId',
        'selectedEdgeId',
        'challengeResult',
        'failedRuleIds',
      ]) ||
      !validString(context.scenarioSlug, 100) ||
      !isRecord(context.graph) ||
      !Array.isArray(context.graph.nodes) ||
      !Array.isArray(context.graph.edges) ||
      context.graph.nodes.length > 30 ||
      context.graph.edges.length > 60
    )
      return { error: 'Design Lab context is invalid.' };
    const scenario = scenarioBySlug.get(context.scenarioSlug as string);
    if (!scenario) return { error: 'Design Lab scenario is unknown.' };
    if (
      !hasOnlyKeys(context.graph, ['nodes', 'edges']) ||
      context.graph.nodes.some(
        (node) =>
          !isRecord(node) ||
          !hasOnlyKeys(node, ['id', 'type', 'label', 'x', 'y', 'config']) ||
          !isRecord(node.config),
      ) ||
      context.graph.edges.some(
        (edge) =>
          !isRecord(edge) || !hasOnlyKeys(edge, ['id', 'from', 'to', 'label']),
      )
    )
      return { error: 'Design Lab graph contains unsupported fields.' };
    if (
      context.phaseId != null &&
      (typeof context.phaseId !== 'string' ||
        !scenario.phases?.some((phase) => phase.id === context.phaseId))
    )
      return { error: 'Design Lab phase is unknown.' };
    const graphErrors = validateSystemGraph(context.graph);
    if (graphErrors.length)
      return { error: `Design Lab graph is invalid. ${graphErrors.join(' ')}` };
    const nodeIds = new Set(
      context.graph.nodes
        .filter(isRecord)
        .map((node) => node.id)
        .filter((id): id is string => typeof id === 'string'),
    );
    const edgeIds = new Set(
      context.graph.edges
        .filter(isRecord)
        .map((edge) => edge.id)
        .filter((id): id is string => typeof id === 'string'),
    );
    if (
      (context.selectedNodeId != null &&
        (typeof context.selectedNodeId !== 'string' ||
          !nodeIds.has(context.selectedNodeId))) ||
      (context.selectedEdgeId != null &&
        (typeof context.selectedEdgeId !== 'string' ||
          !edgeIds.has(context.selectedEdgeId)))
    )
      return { error: 'Design Lab selection references an unknown subject.' };
    if (context.challengeResult != null) {
      if (!isRecord(context.challengeResult))
        return { error: 'Design Lab challenge result is invalid.' };
      const challengeResult = context.challengeResult;
      const challengeDefinition = getChallengeForScenario(
        context.scenarioSlug as string,
      );
      if (
        !hasOnlyKeys(challengeResult, [
          'challengeId',
          'challengeVersion',
          'scenarioSlug',
          'phaseId',
          'educationalModel',
          'primaryEffect',
          'predictionMatches',
          'affectedNodeIds',
          'affectedEdgeIds',
          'metrics',
          'steps',
          'observations',
          'reflectionPrompt',
        ]) ||
        challengeResult.challengeId !== challengeDefinition?.id ||
        challengeResult.challengeVersion !== 1 ||
        challengeResult.scenarioSlug !== context.scenarioSlug ||
        challengeResult.phaseId !== context.phaseId ||
        challengeResult.educationalModel !== true ||
        !SYSTEM_CHALLENGE_EFFECTS.includes(
          challengeResult.primaryEffect as never,
        ) ||
        typeof challengeResult.predictionMatches !== 'boolean' ||
        !Array.isArray(challengeResult.affectedNodeIds) ||
        challengeResult.affectedNodeIds.length > 30 ||
        !Array.isArray(challengeResult.affectedEdgeIds) ||
        challengeResult.affectedEdgeIds.length > 60 ||
        challengeResult.affectedNodeIds.some(
          (id) => typeof id !== 'string' || !nodeIds.has(id),
        ) ||
        challengeResult.affectedEdgeIds.some(
          (id) => typeof id !== 'string' || !edgeIds.has(id),
        ) ||
        !Array.isArray(challengeResult.metrics) ||
        challengeResult.metrics.length > 5 ||
        challengeResult.metrics.some(
          (metric) =>
            !isRecord(metric) ||
            !hasOnlyKeys(metric, [
              'name',
              'band',
              'direction',
              'observation',
            ]) ||
            !SYSTEM_CHALLENGE_METRICS.includes(metric.name as never) ||
            !['healthy', 'elevated', 'critical'].includes(
              String(metric.band),
            ) ||
            !['stable', 'up', 'down'].includes(String(metric.direction)) ||
            !validString(metric.observation, 500),
        ) ||
        !Array.isArray(challengeResult.steps) ||
        challengeResult.steps.length > 20 ||
        challengeResult.steps.some(
          (candidate) =>
            !isRecord(candidate) ||
            !hasOnlyKeys(candidate, [
              'nodeId',
              'edgeId',
              'label',
              'narration',
              'metric',
              'band',
            ]) ||
            typeof candidate.nodeId !== 'string' ||
            !nodeIds.has(candidate.nodeId) ||
            !validString(candidate.label, 160) ||
            !validString(candidate.narration, 800) ||
            (candidate.edgeId != null &&
              (typeof candidate.edgeId !== 'string' ||
                !edgeIds.has(candidate.edgeId))) ||
            (candidate.metric != null &&
              !SYSTEM_CHALLENGE_METRICS.includes(candidate.metric as never)) ||
            (candidate.band != null &&
              !['healthy', 'elevated', 'critical'].includes(
                String(candidate.band),
              )),
        ) ||
        !Array.isArray(challengeResult.observations) ||
        challengeResult.observations.length > 10 ||
        challengeResult.observations.some(
          (observation) => !validString(observation, 500),
        ) ||
        !validString(challengeResult.reflectionPrompt, 600)
      )
        return { error: 'Design Lab challenge result has invalid anchors.' };
    }
    if (
      context.failedRuleIds != null &&
      (!Array.isArray(context.failedRuleIds) ||
        context.failedRuleIds.length > 20 ||
        context.failedRuleIds.some((id) => typeof id !== 'string'))
    )
      return { error: 'Design Lab failed-rule context is invalid.' };
  } else return { error: 'Tutor context kind is not supported.' };

  if (
    input.citations != null &&
    (!Array.isArray(input.citations) ||
      input.citations.length > 8 ||
      input.citations.some((citation) => typeof citation !== 'string'))
  )
    return { error: 'citations must contain at most eight local IDs.' };
  return {
    value: {
      question: (input.question as string).trim(),
      helpLevel: input.helpLevel as TutorRequest['helpLevel'],
      context: context as unknown as TutorSceneContext,
      citations: input.citations as string[] | undefined,
    },
  };
}

export function sanitizeTutorOverlay(
  overlay: unknown,
  context: TutorSceneContext,
): TutorOverlay | undefined {
  if (!isRecord(overlay) || typeof overlay.kind !== 'string') return undefined;
  const label = validString(overlay.label, 160)
    ? (overlay.label as string)
    : 'Tutor focus';
  if (overlay.kind === 'highlight-items' && context.kind === 'bubble-sort') {
    if (!Array.isArray(overlay.itemIds)) return undefined;
    const validIds = new Set(context.items.map((item) => item.id));
    const itemIds = overlay.itemIds.filter(
      (id): id is string => typeof id === 'string' && validIds.has(id),
    );
    return itemIds.length
      ? { kind: 'highlight-items', itemIds, label }
      : undefined;
  }
  if (overlay.kind === 'highlight-system' && context.kind === 'design-lab') {
    if (!Array.isArray(overlay.nodeIds) || !Array.isArray(overlay.edgeIds))
      return undefined;
    const validNodes = new Set(context.graph.nodes.map((node) => node.id));
    const validEdges = new Set(context.graph.edges.map((edge) => edge.id));
    const nodeIds = overlay.nodeIds.filter(
      (id): id is string => typeof id === 'string' && validNodes.has(id),
    );
    const edgeIds = overlay.edgeIds.filter(
      (id): id is string => typeof id === 'string' && validEdges.has(id),
    );
    return nodeIds.length || edgeIds.length
      ? { kind: 'highlight-system', nodeIds, edgeIds, label }
      : undefined;
  }
  if (
    overlay.kind === 'focus-phase' &&
    context.kind === 'design-lab' &&
    typeof overlay.phaseId === 'string' &&
    overlay.phaseId === context.phaseId
  )
    return { kind: 'focus-phase', phaseId: overlay.phaseId, label };
  if (
    overlay.kind === 'focus-metric' &&
    context.kind === 'design-lab' &&
    SYSTEM_CHALLENGE_METRICS.includes(overlay.metric as never) &&
    context.challengeResult?.metrics.some(
      (metric) => metric.name === overlay.metric,
    )
  )
    return {
      kind: 'focus-metric',
      metric: overlay.metric as SystemChallengeMetricName,
      label,
    };
  return undefined;
}
