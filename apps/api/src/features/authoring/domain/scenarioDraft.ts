import { createHash } from 'node:crypto';
import {
  type BubbleSortScenarioDraft,
  type DesignLabScenarioDraft,
  type LearningScenarioDraft,
  type ScenarioEvalCategory,
  type ScenarioEvalCheck,
  type ScenarioEvalReport,
} from '@algoflow/contracts';
import {
  createBubbleSortChallenge,
  validateBubbleSortChallengeDefinition,
} from '@algoflow/learning-engine';
import {
  getChallengeForScenario,
  runDesignChallenge,
} from '../../simulations/domain/challenges';
import { scenarioBySlug } from '../../simulations/domain/scenarios';
import { validateSystemGraph } from '../../simulations/domain/systemDesign';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, allowed: string[]) {
  const allowedSet = new Set(allowed);
  return Object.keys(value).every((key) => allowedSet.has(key));
}

function commonDraftIsValid(value: Record<string, unknown>) {
  return (
    typeof value.id === 'string' &&
    /^[a-z0-9][a-z0-9-]{1,79}$/.test(value.id) &&
    value.version === 1 &&
    typeof value.title === 'string' &&
    value.title.trim().length > 0 &&
    value.title.length <= 120 &&
    typeof value.objective === 'string' &&
    value.objective.trim().length > 0 &&
    value.objective.length <= 240 &&
    ['foundation', 'intermediate', 'advanced'].includes(
      String(value.difficulty),
    )
  );
}

export function parseLearningScenarioDraft(input: unknown): {
  value?: LearningScenarioDraft;
  error?: string;
} {
  if (!isRecord(input) || !commonDraftIsValid(input))
    return { error: 'Draft metadata or schema is invalid.' };
  if (input.kind === 'bubble-sort') {
    if (
      !exactKeys(input, [
        'id',
        'version',
        'kind',
        'title',
        'objective',
        'difficulty',
        'values',
        'expectedFinal',
      ]) ||
      !Array.isArray(input.values) ||
      !Array.isArray(input.expectedFinal) ||
      input.values.some((value) => !Number.isFinite(value)) ||
      input.expectedFinal.some((value) => !Number.isFinite(value))
    )
      return { error: 'Bubble Sort draft schema is invalid.' };
    return { value: input as unknown as BubbleSortScenarioDraft };
  }
  if (input.kind === 'design-lab') {
    if (
      !exactKeys(input, [
        'id',
        'version',
        'kind',
        'title',
        'objective',
        'difficulty',
        'scenarioSlug',
        'challengeId',
        'loadProfile',
        'failure',
        'predictionOptions',
        'expectedPrimaryEffect',
      ]) ||
      typeof input.scenarioSlug !== 'string' ||
      typeof input.challengeId !== 'string' ||
      typeof input.loadProfile !== 'string' ||
      typeof input.failure !== 'string' ||
      !Array.isArray(input.predictionOptions) ||
      input.predictionOptions.some((option) => typeof option !== 'string') ||
      typeof input.expectedPrimaryEffect !== 'string'
    )
      return { error: 'Design Lab draft schema is invalid.' };
    return { value: input as unknown as DesignLabScenarioDraft };
  }
  return { error: 'Draft kind is not supported.' };
}

function check(
  id: string,
  category: ScenarioEvalCategory,
  passed: boolean,
  evidence: string,
  subjectIds?: string[],
): ScenarioEvalCheck {
  return {
    id,
    category,
    status: passed ? 'pass' : 'fail',
    blocking: true,
    evidence,
    subjectIds,
  };
}

function digest(draft: LearningScenarioDraft) {
  return createHash('sha256')
    .update(JSON.stringify(draft))
    .digest('hex')
    .slice(0, 20);
}

function bubbleChecks(draft: BubbleSortScenarioDraft) {
  const definitionErrors = validateBubbleSortChallengeDefinition({
    id: draft.id,
    version: draft.version,
    title: draft.title,
    objective: draft.objective,
    values: draft.values,
  });
  const expected = [...draft.values].sort((left, right) => left - right);
  let challenge;
  try {
    challenge = createBubbleSortChallenge({
      id: draft.id,
      version: 1,
      title: draft.title,
      objective: draft.objective,
      values: draft.values,
    });
  } catch {
    challenge = undefined;
  }
  const stateConsistent =
    expected.length === draft.expectedFinal.length &&
    expected.every((value, index) => value === draft.expectedFinal[index]);
  const possibleStates =
    challenge?.steps.every(
      (step) =>
        !step.compared ||
        (step.compared[1] === step.compared[0] + 1 &&
          step.compared[1] < step.items.length),
    ) ?? false;
  return [
    check(
      'schema',
      'schema',
      true,
      'The draft matches the strict Bubble Sort schema.',
    ),
    check(
      'bounds',
      'bounds',
      definitionErrors.length === 0,
      definitionErrors.length
        ? definitionErrors.join(' ')
        : 'Values and text stay inside authoring bounds.',
    ),
    check(
      'references',
      'references',
      true,
      'Bubble Sort does not reference an external scenario.',
    ),
    check(
      'solvability',
      'solvability',
      Boolean(challenge?.decisions.length),
      challenge?.decisions.length
        ? `${challenge.decisions.length} deterministic learner decisions were generated.`
        : 'No deterministic decision sequence could be generated.',
    ),
    check(
      'state-consistency',
      'state-consistency',
      stateConsistent,
      stateConsistent
        ? 'The declared final state equals the deterministic sorted state.'
        : 'expectedFinal does not match the sorted input.',
    ),
    check(
      'impossible-states',
      'impossible-states',
      possibleStates,
      possibleStates
        ? 'Every comparison references one valid adjacent pair.'
        : 'The generated sequence contains an invalid comparison state.',
    ),
    check(
      'visual-clarity',
      'visual-clarity',
      draft.values.length <= 8 &&
        draft.values.every((value) => value >= 1 && value <= 99),
      'The SVG scene supports at most eight positive two-digit bars.',
    ),
  ];
}

function designChecks(draft: DesignLabScenarioDraft) {
  const scenario = scenarioBySlug.get(draft.scenarioSlug);
  const definition = getChallengeForScenario(draft.scenarioSlug);
  const referencesValid = Boolean(
    scenario && definition && definition.id === draft.challengeId,
  );
  const uniqueOptions = new Set(draft.predictionOptions);
  const boundsValid =
    draft.predictionOptions.length >= 2 &&
    draft.predictionOptions.length <= 5 &&
    uniqueOptions.size === draft.predictionOptions.length;
  const allowedConfiguration = Boolean(
    definition?.loadProfiles.includes(draft.loadProfile) &&
      definition.failures.includes(draft.failure) &&
      draft.predictionOptions.every((effect) =>
        definition.predictionOptions.includes(effect),
      ),
  );
  const run =
    scenario && definition && draft.predictionOptions[0]
      ? runDesignChallenge({
          scenarioSlug: scenario.slug,
          challengeId: definition.id,
          graph: scenario.initialGraph,
          phaseId: definition.phaseId,
          prediction: draft.predictionOptions[0],
          loadProfile: draft.loadProfile,
          failure: draft.failure,
        })
      : undefined;
  const primaryEffect = run?.value?.primaryEffect;
  const solvable = Boolean(
    primaryEffect && draft.predictionOptions.includes(primaryEffect),
  );
  const stateConsistent = primaryEffect === draft.expectedPrimaryEffect;
  const visualClear = Boolean(
    scenario &&
      validateSystemGraph(scenario.initialGraph).length === 0 &&
      scenario.initialGraph.nodes.length <= 12 &&
      scenario.initialGraph.nodes.every((node, index, nodes) =>
        nodes.slice(index + 1).every((candidate) => {
          const x = candidate.x - node.x;
          const y = candidate.y - node.y;
          return Math.sqrt(x * x + y * y) >= 80;
        }),
      ) &&
      run?.value?.steps.every((step) =>
        scenario.initialGraph.nodes.some((node) => node.id === step.nodeId),
      ),
  );
  return [
    check(
      'schema',
      'schema',
      true,
      'The draft matches the strict Design Lab schema.',
    ),
    check(
      'bounds',
      'bounds',
      boundsValid,
      boundsValid
        ? 'Prediction options are unique and inside the supported visual bound.'
        : 'Use two to five unique prediction options.',
    ),
    check(
      'references',
      'references',
      referencesValid,
      referencesValid
        ? 'Scenario and challenge references resolve to the deterministic catalog.'
        : 'The scenario or challenge reference does not resolve.',
      [draft.scenarioSlug, draft.challengeId],
    ),
    check(
      'solvability',
      'solvability',
      solvable,
      solvable
        ? `The model resolves to ${primaryEffect}, which the learner can select.`
        : 'The deterministic outcome is not available among the learner options.',
    ),
    check(
      'state-consistency',
      'state-consistency',
      stateConsistent,
      stateConsistent
        ? 'The declared expected effect matches a fresh deterministic run.'
        : `Expected ${draft.expectedPrimaryEffect}, but the model resolves to ${primaryEffect ?? 'no valid state'}.`,
    ),
    check(
      'impossible-states',
      'impossible-states',
      allowedConfiguration,
      allowedConfiguration
        ? 'Load, failure, and effects are all supported by the referenced challenge.'
        : 'The draft combines states that the referenced challenge does not allow.',
    ),
    check(
      'visual-clarity',
      'visual-clarity',
      visualClear &&
        draft.title.length <= 80 &&
        draft.predictionOptions.length <= 4,
      visualClear &&
        draft.title.length <= 80 &&
        draft.predictionOptions.length <= 4
        ? 'Canonical coordinates, labels, static trace anchors, title, and choices fit the supported scene.'
        : 'The referenced graph, trace anchors, title, or choices exceed the supported visual bounds.',
    ),
  ];
}

export function evaluateScenarioDraft(
  draft: LearningScenarioDraft,
): ScenarioEvalReport {
  const checks =
    draft.kind === 'bubble-sort' ? bubbleChecks(draft) : designChecks(draft);
  return {
    suiteVersion: 1,
    draftDigest: digest(draft),
    passed: checks.every((candidate) => candidate.status === 'pass'),
    humanReviewRequired: true,
    checks,
  };
}

export function isScenarioAuthoringEnabled(
  environment: {
    ENABLE_SCENARIO_AUTHORING?: string;
    NODE_ENV?: string;
  } = process.env,
) {
  return (
    environment.ENABLE_SCENARIO_AUTHORING === '1' &&
    environment.NODE_ENV !== 'production'
  );
}
