import {
  SYSTEM_CHALLENGE_EFFECTS,
  SYSTEM_CHALLENGE_FAILURES,
  SYSTEM_CHALLENGE_LOAD_PROFILES,
  type SystemChallengeDefinition,
  type SystemChallengeEffect,
  type SystemChallengeMetric,
  type SystemChallengeRunRequest,
  type SystemChallengeRunResult,
  type SystemChallengeStep,
  type SystemDesignGraph,
  type SystemDesignScenario,
  type SystemNode,
  type SystemNodeType,
} from '@algoflow/contracts';
import { scenarioBySlug } from './scenarios';
import { evaluateSystemDesign, validateSystemGraph } from './systemDesign';

const authoredChallengeDefinitions: readonly SystemChallengeDefinition[] = [
  {
    id: 'url-shortener-traffic-spike',
    version: 1,
    scenarioSlug: 'url-shortener',
    title: 'Predict a redirect traffic spike',
    objective:
      'Predict which pressure appears first when popular redirects become a hot path.',
    constraints: [
      'The mapping database remains authoritative.',
      'The simulation models relative behavior, not production capacity.',
    ],
    predictionOptions: ['latency-rise', 'queue-pressure', 'throttled-load'],
    loadProfiles: ['surge', 'extreme'],
    failures: ['load-spike'],
  },
  {
    id: 'strangler-cutover-timeout',
    version: 1,
    scenarioSlug: 'monolith-strangler-migration',
    phaseId: 'cutover',
    title: 'Predict a cutover dependency timeout',
    objective:
      'Decide whether the current migration controls contain a timeout during bounded cutover.',
    constraints: [
      'The monolith is still available during this phase.',
      'A safe outcome requires an explicit, tested routing control.',
    ],
    predictionOptions: ['recovery-path', 'cutover-risk'],
    loadProfiles: ['baseline', 'surge'],
    failures: ['dependency-timeout'],
  },
  {
    id: 'database-replication-lag',
    version: 1,
    scenarioSlug: 'online-database-migration',
    title: 'Predict replication lag before cutover',
    objective:
      'Predict whether the design exposes and contains lag before authority moves.',
    constraints: [
      'The source continues accepting production writes.',
      'Cutover must not rely on an unverified destination.',
    ],
    predictionOptions: ['stale-read', 'recovery-path', 'cutover-risk'],
    loadProfiles: ['baseline', 'surge'],
    failures: ['replica-lag'],
  },
  {
    id: 'service-overload-boundary',
    version: 1,
    scenarioSlug: 'overload-protection',
    title: 'Predict overload propagation',
    objective:
      'Predict whether excess work is bounded or cascades into the database.',
    constraints: [
      'The database has a lower safe capacity than peak traffic.',
      'Retries and unbounded queues consume capacity.',
    ],
    predictionOptions: [
      'throttled-load',
      'queue-pressure',
      'availability-loss',
    ],
    loadProfiles: ['surge', 'extreme'],
    failures: ['load-spike'],
  },
];

function genericFailureFor(scenario: SystemDesignScenario) {
  if (scenario.category === 'migration') return 'dependency-timeout' as const;
  if (scenario.category === 'database') return 'replica-lag' as const;
  if (scenario.category === 'reliability') return 'region-outage' as const;
  return 'load-spike' as const;
}

function predictionOptionsFor(
  failure: ReturnType<typeof genericFailureFor>,
): SystemChallengeEffect[] {
  if (failure === 'replica-lag')
    return ['stale-read', 'cutover-risk', 'recovery-path'];
  if (failure === 'region-outage')
    return ['availability-loss', 'cutover-risk', 'recovery-path'];
  if (failure === 'dependency-timeout')
    return ['latency-rise', 'availability-loss', 'recovery-path'];
  return ['queue-pressure', 'latency-rise', 'throttled-load'];
}

const authoredScenarioSlugs = new Set(
  authoredChallengeDefinitions.map((definition) => definition.scenarioSlug),
);

const generatedChallengeDefinitions: SystemChallengeDefinition[] = [
  ...scenarioBySlug.values(),
]
  .filter((scenario) => !authoredScenarioSlugs.has(scenario.slug))
  .map((scenario) => {
    const failure = genericFailureFor(scenario);
    return {
      id: `${scenario.slug}-failure-rehearsal`,
      version: 1,
      scenarioSlug: scenario.slug,
      title: `Predict failure in ${scenario.title}`,
      objective:
        'Predict the dominant modeled effect, run the current graph, and compare the result with deterministic rubric evidence.',
      phaseId:
        scenario.category === 'migration'
          ? scenario.phases?.find((phase) => phase.id === 'cutover')?.id
          : undefined,
      constraints: scenario.rubric
        .slice(0, 3)
        .map((rule) => `${rule.title}: ${rule.success}`),
      predictionOptions:
        scenario.category === 'migration'
          ? ['cutover-risk', 'latency-rise', 'recovery-path']
          : predictionOptionsFor(failure),
      loadProfiles: [...SYSTEM_CHALLENGE_LOAD_PROFILES],
      failures: [failure],
    };
  });

const challengeDefinitions: readonly SystemChallengeDefinition[] = [
  ...authoredChallengeDefinitions,
  ...generatedChallengeDefinitions,
];

const definitionByScenario = new Map(
  challengeDefinitions.map((definition) => [
    definition.scenarioSlug,
    definition,
  ]),
);

function nodesOfType(graph: SystemDesignGraph, type: SystemNodeType) {
  return graph.nodes.filter((node) => node.type === type);
}

function firstNode(graph: SystemDesignGraph, types: readonly SystemNodeType[]) {
  for (const type of types) {
    const node = graph.nodes.find((candidate) => candidate.type === type);
    if (node) return node;
  }
  return graph.nodes[0];
}

function hasNode(graph: SystemDesignGraph, type: SystemNodeType) {
  return graph.nodes.some((node) => node.type === type);
}

function hasConfiguredNode(
  graph: SystemDesignGraph,
  type: SystemNodeType,
  key: string,
  value: string | number | boolean = true,
) {
  return graph.nodes.some(
    (node) => node.type === type && node.config[key] === value,
  );
}

function hasPath(
  graph: SystemDesignGraph,
  fromType: SystemNodeType,
  toType: SystemNodeType,
) {
  const starts = nodesOfType(graph, fromType).map((node) => node.id);
  const targets = new Set(nodesOfType(graph, toType).map((node) => node.id));
  const queue = [...starts];
  const visited = new Set(queue);
  while (queue.length) {
    const current = queue.shift()!;
    if (targets.has(current)) return true;
    for (const edge of graph.edges) {
      if (edge.from === current && !visited.has(edge.to)) {
        visited.add(edge.to);
        queue.push(edge.to);
      }
    }
  }
  return false;
}

function relatedEdgeIds(graph: SystemDesignGraph, nodeIds: string[]) {
  const ids = new Set(nodeIds);
  return graph.edges
    .filter((edge) => ids.has(edge.from) && ids.has(edge.to))
    .map((edge) => edge.id);
}

function step(
  node: SystemNode | undefined,
  phase: SystemChallengeStep['phase'],
  label: string,
  narration: string,
  metric?: SystemChallengeStep['metric'],
  band?: SystemChallengeStep['band'],
): SystemChallengeStep | undefined {
  if (!node) return undefined;
  return { nodeId: node.id, phase, label, narration, metric, band };
}

function compactSteps(
  candidates: Array<SystemChallengeStep | undefined>,
): SystemChallengeStep[] {
  return candidates.filter((candidate): candidate is SystemChallengeStep =>
    Boolean(candidate),
  );
}

function metricsFor(
  effect: SystemChallengeEffect,
  loadProfile: SystemChallengeRunRequest['loadProfile'] = 'baseline',
): SystemChallengeMetric[] {
  const table: Record<SystemChallengeEffect, SystemChallengeMetric[]> = {
    'latency-rise': [
      {
        name: 'latency',
        band: 'elevated',
        direction: 'up',
        observation: 'More requests reach a constrained read path.',
      },
      {
        name: 'availability',
        band: 'healthy',
        direction: 'stable',
        observation:
          'The path remains available while latency absorbs pressure.',
      },
    ],
    'queue-pressure': [
      {
        name: 'queue-pressure',
        band: 'critical',
        direction: 'up',
        observation: 'Accepted work accumulates faster than it is drained.',
      },
      {
        name: 'latency',
        band: 'elevated',
        direction: 'up',
        observation: 'Waiting time grows behind the constrained boundary.',
      },
    ],
    'availability-loss': [
      {
        name: 'availability',
        band: 'critical',
        direction: 'down',
        observation:
          'Unbounded work reaches the dependency and propagates failure.',
      },
      {
        name: 'recovery',
        band: 'critical',
        direction: 'down',
        observation:
          'There is no explicit containment path in the visible graph.',
      },
    ],
    'stale-read': [
      {
        name: 'consistency',
        band: 'critical',
        direction: 'down',
        observation:
          'Destination state can lag behind the authoritative source.',
      },
      {
        name: 'recovery',
        band: 'elevated',
        direction: 'down',
        observation:
          'Cutover should pause until reconciliation evidence recovers.',
      },
    ],
    'recovery-path': [
      {
        name: 'recovery',
        band: 'healthy',
        direction: 'up',
        observation:
          'The graph contains an explicit route to contain or reverse the failure.',
      },
      {
        name: 'availability',
        band: 'elevated',
        direction: 'stable',
        observation:
          'Impact is visible, but authority can remain on the safe path.',
      },
    ],
    'cutover-risk': [
      {
        name: 'recovery',
        band: 'critical',
        direction: 'down',
        observation: 'The visible cutover lacks a complete reversible control.',
      },
      {
        name: 'consistency',
        band: 'elevated',
        direction: 'down',
        observation:
          'Authority may move before the destination is proven safe.',
      },
    ],
    'throttled-load': [
      {
        name: 'availability',
        band: 'healthy',
        direction: 'stable',
        observation:
          'The critical path stays available by bounding excess work.',
      },
      {
        name: 'queue-pressure',
        band: 'elevated',
        direction: 'up',
        observation: 'Pressure is visible at an intentional capacity boundary.',
      },
    ],
  };
  return table[effect].map((metric, index) =>
    loadProfile === 'extreme' && index === 0 && metric.band === 'elevated'
      ? {
          ...metric,
          band: 'critical',
          observation: `${metric.observation} Extreme load raises this modeled band to critical.`,
        }
      : metric,
  );
}

function evaluateEffect(input: SystemChallengeRunRequest) {
  const { graph, scenarioSlug } = input;
  if (scenarioSlug === 'url-shortener') {
    const hasCache = hasNode(graph, 'cache');
    const hasDistribution =
      hasNode(graph, 'load-balancer') &&
      nodesOfType(graph, 'service').some(
        (node) => Number(node.config.replicas ?? 1) > 1,
      );
    if (hasCache && hasDistribution) return 'throttled-load';
    return hasCache || hasDistribution ? 'latency-rise' : 'queue-pressure';
  }
  if (scenarioSlug === 'monolith-strangler-migration') {
    const reversible =
      hasConfiguredNode(graph, 'proxy', 'rollbackReady') &&
      hasNode(graph, 'feature-flag') &&
      hasPath(graph, 'client', 'service');
    return reversible ? 'recovery-path' : 'cutover-risk';
  }
  if (scenarioSlug === 'online-database-migration') {
    const observableCopy =
      hasPath(graph, 'relational-database', 'database-replica') &&
      hasNode(graph, 'change-data-capture') &&
      hasNode(graph, 'observability');
    const reversible = hasConfiguredNode(graph, 'proxy', 'rollbackReady');
    return observableCopy && reversible
      ? 'recovery-path'
      : observableCopy
        ? 'stale-read'
        : 'cutover-risk';
  }
  if (scenarioSlug !== 'overload-protection') {
    const scenario = scenarioBySlug.get(scenarioSlug)!;
    const evaluation = evaluateSystemDesign(
      scenario,
      graph,
      'The design deliberately balances correctness, availability, recovery, and operational cost across the modeled failure.',
    );
    const passedCategories = new Set(
      evaluation.evidence
        .filter((item) => item.passed)
        .map((item) => item.category),
    );
    const recoveryReady =
      evaluation.passed ||
      passedCategories.has('migration-safety') ||
      (passedCategories.has('availability') &&
        passedCategories.has('durability'));
    if (scenario.category === 'migration')
      return recoveryReady ? 'recovery-path' : 'cutover-risk';
    if (input.failure === 'replica-lag')
      return recoveryReady ? 'recovery-path' : 'stale-read';
    if (input.failure === 'region-outage')
      return recoveryReady ? 'recovery-path' : 'availability-loss';
    if (input.failure === 'dependency-timeout')
      return recoveryReady ? 'recovery-path' : 'latency-rise';
    return evaluation.passed ? 'throttled-load' : 'queue-pressure';
  }
  const bounded =
    hasNode(graph, 'load-balancer') &&
    hasNode(graph, 'queue') &&
    nodesOfType(graph, 'service').some(
      (node) => Number(node.config.replicas ?? 1) >= 3,
    );
  if (bounded) return 'throttled-load';
  if (hasNode(graph, 'queue')) return 'queue-pressure';
  return 'availability-loss';
}

function affectedNodes(
  graph: SystemDesignGraph,
  scenarioSlug: string,
): SystemNode[] {
  const typesByScenario: Record<string, SystemNodeType[]> = {
    'url-shortener': [
      'api-gateway',
      'load-balancer',
      'service',
      'cache',
      'relational-database',
    ],
    'monolith-strangler-migration': [
      'client',
      'proxy',
      'feature-flag',
      'service',
      'legacy-system',
    ],
    'online-database-migration': [
      'relational-database',
      'change-data-capture',
      'database-replica',
      'observability',
      'proxy',
    ],
    'overload-protection': [
      'client',
      'load-balancer',
      'service',
      'queue',
      'relational-database',
    ],
  };
  const allowed = new Set(typesByScenario[scenarioSlug] ?? []);
  const nodes = graph.nodes.filter((node) => allowed.has(node.type));
  return nodes.length ? nodes : graph.nodes.slice(0, 5);
}

function buildSteps(
  graph: SystemDesignGraph,
  scenarioSlug: string,
  effect: SystemChallengeEffect,
  loadProfile: SystemChallengeRunRequest['loadProfile'],
) {
  const first = firstNode(graph, ['client', 'service', 'legacy-system']);
  const boundary = firstNode(graph, [
    'load-balancer',
    'proxy',
    'change-data-capture',
    'queue',
    'service',
  ]);
  const dependency = firstNode(graph, [
    'cache',
    'database-replica',
    'relational-database',
    'legacy-system',
  ]);
  return compactSteps([
    step(
      first,
      'initial',
      'Inject condition',
      `The ${scenarioSlug.replaceAll('-', ' ')} model receives the selected load and failure.`,
      'latency',
      'elevated',
    ),
    step(
      boundary,
      effect === 'recovery-path' || effect === 'throttled-load'
        ? 'recovery'
        : 'failure',
      'Reach the control boundary',
      'The simulation checks only controls that exist in the current graph.',
      effect === 'queue-pressure' ? 'queue-pressure' : 'availability',
      effect === 'recovery-path' || effect === 'throttled-load'
        ? 'healthy'
        : 'elevated',
    ),
    step(
      dependency,
      'terminal',
      'Observe the dominant effect',
      `The conceptual model resolves to ${effect.replaceAll('-', ' ')}.`,
      metricsFor(effect, loadProfile)[0]?.name,
      metricsFor(effect, loadProfile)[0]?.band,
    ),
  ]);
}

export function validateDesignChallengeCatalog(
  scenarios: readonly SystemDesignScenario[] = [...scenarioBySlug.values()],
) {
  const errors: string[] = [];
  const scenarioMap = new Map(
    scenarios.map((scenario) => [scenario.slug, scenario]),
  );
  const challengeIds = new Set<string>();
  const challengedScenarios = new Set<string>();
  for (const definition of challengeDefinitions) {
    if (challengeIds.has(definition.id))
      errors.push(`Duplicate challenge ID: ${definition.id}`);
    challengeIds.add(definition.id);
    if (challengedScenarios.has(definition.scenarioSlug))
      errors.push(`Duplicate challenge scenario: ${definition.scenarioSlug}`);
    challengedScenarios.add(definition.scenarioSlug);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(definition.id))
      errors.push(`Invalid challenge ID: ${definition.id}`);
    if (definition.version !== 1)
      errors.push(`Unsupported version for challenge ${definition.id}`);
    if (
      !definition.title.trim() ||
      definition.title.length > 120 ||
      !definition.objective.trim() ||
      definition.objective.length > 300
    )
      errors.push(`Invalid copy for challenge ${definition.id}`);
    if (
      definition.constraints.length === 0 ||
      definition.constraints.length > 8 ||
      definition.constraints.some(
        (constraint) => !constraint.trim() || constraint.length > 300,
      )
    )
      errors.push(`Invalid constraints for challenge ${definition.id}`);
    const scenario = scenarioMap.get(definition.scenarioSlug);
    if (!scenario)
      errors.push(`Unknown challenge scenario: ${definition.scenarioSlug}`);
    if (
      definition.phaseId &&
      !scenario?.phases?.some((phase) => phase.id === definition.phaseId)
    )
      errors.push(
        `Unknown phase ${definition.phaseId} for challenge ${definition.id}`,
      );
    if (!definition.predictionOptions.length)
      errors.push(`Challenge ${definition.id} has no prediction options.`);
    if (
      new Set(definition.predictionOptions).size !==
        definition.predictionOptions.length ||
      definition.predictionOptions.some(
        (effect) => !SYSTEM_CHALLENGE_EFFECTS.includes(effect),
      )
    )
      errors.push(`Challenge ${definition.id} has invalid prediction options.`);
    if (
      definition.loadProfiles.length === 0 ||
      definition.loadProfiles.some(
        (profile) => !SYSTEM_CHALLENGE_LOAD_PROFILES.includes(profile),
      ) ||
      definition.failures.length === 0 ||
      definition.failures.some(
        (failure) => !SYSTEM_CHALLENGE_FAILURES.includes(failure),
      )
    )
      errors.push(`Challenge ${definition.id} has invalid run controls.`);
  }
  for (const scenario of scenarios)
    if (!challengedScenarios.has(scenario.slug))
      errors.push(`Missing challenge scenario: ${scenario.slug}`);
  return errors;
}

export function getChallengeForScenario(scenarioSlug: string) {
  return definitionByScenario.get(scenarioSlug);
}

export function getDesignChallengeCatalog() {
  return [...challengeDefinitions];
}

export function runDesignChallenge(input: SystemChallengeRunRequest): {
  value?: SystemChallengeRunResult;
  error?: string;
  missing?: true;
} {
  const definition = getChallengeForScenario(input.scenarioSlug);
  if (!definition || definition.id !== input.challengeId)
    return { missing: true, error: 'Challenge not found.' };
  const graphErrors = validateSystemGraph(input.graph);
  if (graphErrors.length) return { error: graphErrors.join(' ') };
  if (definition.phaseId !== input.phaseId)
    return { error: 'The challenge must run in its configured phase.' };
  if (!definition.loadProfiles.includes(input.loadProfile))
    return { error: 'The selected load profile is not available.' };
  if (!definition.failures.includes(input.failure))
    return { error: 'The selected failure is not available.' };
  if (!definition.predictionOptions.includes(input.prediction))
    return { error: 'The selected prediction is not available.' };

  const primaryEffect = evaluateEffect(input) as SystemChallengeEffect;
  const affected = affectedNodes(input.graph, input.scenarioSlug);
  const affectedNodeIds = affected.map((node) => node.id);
  const affectedEdgeIds = relatedEdgeIds(input.graph, affectedNodeIds);
  const controlsPresent =
    primaryEffect === 'recovery-path' || primaryEffect === 'throttled-load';
  return {
    value: {
      challengeId: definition.id,
      challengeVersion: definition.version,
      scenarioSlug: definition.scenarioSlug,
      phaseId: definition.phaseId,
      educationalModel: true,
      primaryEffect,
      predictionMatches: input.prediction === primaryEffect,
      affectedNodeIds,
      affectedEdgeIds,
      metrics: metricsFor(primaryEffect, input.loadProfile),
      steps: buildSteps(
        input.graph,
        input.scenarioSlug,
        primaryEffect,
        input.loadProfile,
      ),
      observations: [
        `The selected ${input.loadProfile} load makes ${primaryEffect.replaceAll('-', ' ')} the dominant modeled effect.`,
        controlsPresent
          ? 'The visible graph includes a control that contains the condition.'
          : 'The visible graph does not yet contain a complete containment control.',
      ],
      reflectionPrompt: controlsPresent
        ? 'Which control would you remove first to prove it is carrying the safety property?'
        : 'What is the smallest visible control you could add to change this outcome?',
    },
  };
}
