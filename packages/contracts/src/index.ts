export const CURRICULUM_DOMAINS = [
  'algorithms',
  'engineering',
  'languages',
  'architecture',
  'data',
  'cloud',
  'ai-foundations',
  'ai-engineering',
  'communication',
] as const;

export type CurriculumDomain = (typeof CURRICULUM_DOMAINS)[number];
export type Tech = 'js' | 'ts' | 'go' | 'sql' | 'python' | 'general' | 'en';
export type LearningLevel = 'foundation' | 'intermediate' | 'advanced';

export const AI_PROVIDER_IDS = [
  'mock',
  'openai',
  'codex-cli',
  'claude-cli',
] as const;
export type AIProviderId = (typeof AI_PROVIDER_IDS)[number];

export const AI_EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'] as const;
export type AIEffort = (typeof AI_EFFORTS)[number];

export interface AIProviderSelection {
  provider: AIProviderId;
  model?: string;
  effort?: AIEffort;
}

export interface AIProviderConfiguration {
  provider: AIProviderId;
  model: string;
  effort?: AIEffort;
}

export interface AIProviderCapability {
  id: AIProviderId;
  label: string;
  available: boolean;
  models: string[];
  efforts: AIEffort[];
  defaultModel: string;
  defaultEffort?: AIEffort;
  unavailableReason?: string;
}

export interface AIProviderCatalog {
  providers: AIProviderCapability[];
  defaultSelection: AIProviderConfiguration;
}

export const LEARNING_RESOURCE_KINDS = [
  'documentation',
  'course',
  'book',
  'paper',
  'guide',
  'case-study',
] as const;
export const LEARNING_RESOURCE_ACCESS = ['free', 'freemium', 'paid'] as const;

export interface LearningResource {
  id: string;
  title: string;
  provider: string;
  url: string;
  kind: (typeof LEARNING_RESOURCE_KINDS)[number];
  access: (typeof LEARNING_RESOURCE_ACCESS)[number];
  language: 'en' | 'es';
}

export function isLearningResource(value: unknown): value is LearningResource {
  if (!value || typeof value !== 'object') return false;
  const resource = value as Partial<LearningResource>;
  return Boolean(
    typeof resource.id === 'string' &&
      resource.id.trim().length > 0 &&
      typeof resource.title === 'string' &&
      resource.title.trim().length > 0 &&
      typeof resource.provider === 'string' &&
      resource.provider.trim().length > 0 &&
      typeof resource.url === 'string' &&
      resource.url.trim().length > 0 &&
      LEARNING_RESOURCE_KINDS.includes(
        resource.kind as LearningResource['kind'],
      ) &&
      LEARNING_RESOURCE_ACCESS.includes(
        resource.access as LearningResource['access'],
      ) &&
      (resource.language === 'en' || resource.language === 'es'),
  );
}

export type VisualizationKind =
  | 'complexity'
  | 'bubble-sort'
  | 'concept-flow'
  | 'runtime-scene';

export const VISUAL_SCENE_KINDS = [
  'growth-curves',
  'sorting-bars',
  'pointer-search',
  'sliding-window',
  'grid-traversal',
  'system-boundaries',
  'event-loop',
  'cdn-route',
  'relational-schema',
  'container-layers',
  'vector-space',
  'agent-loop',
  'active-reading',
  'impact-ripple',
  'strategy-map',
  'migration-timeline',
] as const;

export type VisualSceneKind = (typeof VISUAL_SCENE_KINDS)[number];
export const VISUAL_STAGE_PHASES = [
  'initial',
  'transition',
  'failure',
  'recovery',
  'terminal',
] as const;
export type VisualStagePhase = (typeof VISUAL_STAGE_PHASES)[number];

export interface ConceptFlowNode {
  id: string;
  label: string;
  detail?: string;
}

export interface ConceptFlowConnection {
  from: string;
  to: string;
  label?: string;
}

export interface ConceptFlowStep {
  id: string;
  phase: VisualStagePhase;
  label: string;
  narration: string;
  metric?: string;
  activeNodeIds: string[];
  completedNodeIds?: string[];
  failedNodeIds?: string[];
  activeConnectionIndexes?: number[];
}

export interface ConceptFlowNarrative {
  version: 1;
  scene: VisualSceneKind;
  nodes: ConceptFlowNode[];
  connections: ConceptFlowConnection[];
  steps: ConceptFlowStep[];
  terminalSummary: string;
}

/**
 * 'pipeline' regions render together as one ordered strip of stations, in
 * declaration order, so a token can travel from stage to stage.
 *
 * 'array' and 'grid' regions hold algorithm data: their per-step contents are
 * `step.arrays` and `step.grids`, generated from the algorithm itself.
 */
export type RuntimeSceneRegionKind =
  | 'stack'
  | 'queue'
  | 'box'
  | 'console'
  | 'pipeline'
  | 'array'
  | 'grid';

/** Region kinds whose scenes are generated, so they may run many steps. */
export const RUNTIME_SCENE_DATA_REGION_KINDS: readonly RuntimeSceneRegionKind[] =
  ['array', 'grid'];

/** Hand-written scenes stay short; generated algorithm traces may run longer. */
export const RUNTIME_SCENE_MAX_STEPS = 12;
export const RUNTIME_SCENE_MAX_GENERATED_STEPS = 80;
export type RuntimeSceneRegionTone =
  | 'green'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'teal';
export type RuntimeSceneTokenTone = 'ok' | 'error' | 'muted';

/** The fixed layout of a 'grid' region. Cell indexes are row-major. */
export interface RuntimeSceneGridLayout {
  rows: number;
  cols: number;
  walls: number[];
  start: number;
  goal: number;
}

export interface RuntimeSceneRegion {
  id: string;
  label: string;
  kind: RuntimeSceneRegionKind;
  tone: RuntimeSceneRegionTone;
  /** Required for, and only allowed on, 'grid' regions. */
  grid?: RuntimeSceneGridLayout;
}

export const RUNTIME_SCENE_CELL_STATES = [
  'default',
  'compare',
  'swap',
  'sorted',
  'visited',
  'frontier',
  'current',
  'path',
] as const;
export type RuntimeSceneCellState = (typeof RUNTIME_SCENE_CELL_STATES)[number];

/**
 * One value of an 'array' region. The id is stable across steps, so a cell
 * that changes position animates there instead of being redrawn.
 */
export interface RuntimeSceneArrayCell {
  id: string;
  label: string;
  state?: RuntimeSceneCellState;
  /** Relative magnitude from 0 to 1, drawn as a small bar under the label. */
  weight?: number;
}

export interface RuntimeSceneArrayPointer {
  label: string;
  index: number;
}

/** The contents of one 'array' region at one step, in display order. */
export interface RuntimeSceneArrayView {
  regionId: string;
  cells: RuntimeSceneArrayCell[];
  pointers?: RuntimeSceneArrayPointer[];
  /** An inclusive highlighted span, e.g. the window or the sorted suffix. */
  range?: { from: number; to: number; label?: string };
}

/** The contents of one 'grid' region at one step. */
export interface RuntimeSceneGridView {
  regionId: string;
  /** One state per cell, row-major: `rows * cols` entries. */
  cells: RuntimeSceneCellState[];
  /** The found route from start to goal, in travel order. */
  path?: number[];
}

/**
 * A predict-first question asked while its step is on screen: the learner
 * commits to what the next step will do before that step is revealed.
 */
export interface RuntimeSceneChallenge {
  prompt: string;
  options: string[];
  /** Index into `options`. */
  answer: number;
  /** Why the answer holds, shown after a wrong pick. */
  explanation: string;
}

export interface RuntimeSceneToken {
  id: string;
  label: string;
  regionId: string;
  tone?: RuntimeSceneTokenTone;
  /** A region this token references, e.g. the scope a closure keeps alive. */
  linkRegionId?: string;
  /** Completion from 0 to 1, drawn as a progress bar for in-flight work. */
  progress?: number;
  /**
   * A grid cell this token belongs to, as `{ regionId, index }`. A token whose
   * own region is that grid is drawn inside the cell; a token elsewhere (the
   * frontier queue or stack) flies in from the cell when it first appears.
   */
  cell?: { regionId: string; index: number };
}

export type RuntimeSceneActionTone = 'compare' | 'swap' | 'ok' | 'error';

export const RUNTIME_SCENE_ACTION_TONES: readonly RuntimeSceneActionTone[] = [
  'compare',
  'swap',
  'ok',
  'error',
];

/** Longest action caption that still fits on two lines of a phone screen. */
export const RUNTIME_SCENE_ACTION_MAX_LENGTH = 64;

/**
 * A short caption of the live operation with its real values, e.g.
 * `guard.canActivate() → false → 403`. It is decorative: the narration stays
 * the accessible description of the step.
 */
export interface RuntimeSceneAction {
  text: string;
  tone?: RuntimeSceneActionTone;
}

/** A full snapshot of the runtime, so seeking to any step is a direct lookup. */
export interface RuntimeSceneStep {
  label: string;
  narration: string;
  /** Zero-based indexes into `code.lines`. */
  codeLines: number[];
  tokens: RuntimeSceneToken[];
  output: string[];
  activeRegionIds?: string[];
  /** 'checking' animates the event-loop indicator while it inspects the queues. */
  eventLoop?: 'idle' | 'checking';
  action?: RuntimeSceneAction;
  arrays?: RuntimeSceneArrayView[];
  grids?: RuntimeSceneGridView[];
  challenge?: RuntimeSceneChallenge;
}

export interface RuntimeScene {
  code: { language: string; lines: string[] };
  /** Cost of what the scene runs, shown as header chips, e.g. `O(n²)`. */
  complexity?: { time: string; space: string };
  regions: RuntimeSceneRegion[];
  steps: RuntimeSceneStep[];
}

export interface VisualBlueprint {
  version: 1;
  scene: VisualSceneKind;
  objective: string;
  terminalEvidence: string;
}

export interface TopicDefinition {
  slug: string;
  title: string;
  description: string;
  domain: CurriculumDomain;
  assessmentSlug?: string;
}

export interface LessonDefinition {
  slug: string;
  title: string;
  summary: string;
  tech: Tech;
  domain: CurriculumDomain;
  topicSlug: string;
  conceptIds: string[];
  estimatedMinutes: number;
  visualization: VisualizationKind;
  conceptFlow?: ConceptFlowNarrative;
  runtimeScene?: RuntimeScene;
  codeLanguage?: 'javascript' | 'typescript' | 'go' | 'sql' | 'python';
  assessmentSlug: string;
  prerequisites: string[];
}

export interface LearningTrackDefinition {
  slug: string;
  title: string;
  description: string;
  outcomes: string[];
  pathSlugs: string[];
  order: number;
}

export type PathModuleDefinition =
  | {
      id: string;
      title: string;
      summary: string;
      status: 'available';
      lessonSlug: string;
      estimatedMinutes: number;
      resources?: LearningResource[];
    }
  | {
      id: string;
      title: string;
      summary: string;
      status: 'planned';
      estimatedMinutes: number;
      resources?: LearningResource[];
    }
  | {
      id: string;
      title: string;
      summary: string;
      status: 'practice';
      href: string;
      estimatedMinutes: number;
      resources?: LearningResource[];
    };

export interface LearningPathDefinition {
  slug: string;
  title: string;
  description: string;
  trackSlug: string;
  level: LearningLevel;
  outcomes: string[];
  prerequisitePathSlugs: string[];
  modules: PathModuleDefinition[];
  lessonSlugs: string[];
  estimatedMinutes: number;
  assessmentSlug?: string;
  visualBlueprint: VisualBlueprint;
}

export const ASSESSMENT_INTENTS = [
  'diagnostic',
  'recall',
  'application',
  'debugging',
  'teach-back',
  'exam',
  'interview',
] as const;
export type AssessmentIntent = (typeof ASSESSMENT_INTENTS)[number];
export type AssessmentDifficulty = 'foundation' | 'intermediate' | 'advanced';
export type TransferLevel = 'familiar' | 'variant' | 'unfamiliar';
export type AssessmentScope = {
  kind: 'lesson' | 'topic' | 'path' | 'simulation';
  slug: string;
};

interface AssessmentQuestionBase {
  id: string;
  prompt: string;
  explanation: string;
  conceptIds: string[];
  intent?: AssessmentIntent;
  difficulty?: AssessmentDifficulty;
  transferLevel?: TransferLevel;
  weight?: number;
  remediationHref?: string;
}

export type AssessmentQuestion =
  | ({
      kind: 'multiple-choice';
      options: string[];
      correctAnswer: string;
    } & AssessmentQuestionBase)
  | ({
      kind: 'multiple-select';
      options: string[];
      correctAnswer: string[];
    } & AssessmentQuestionBase)
  | ({
      kind: 'short-answer';
      acceptedAnswers: string[];
    } & AssessmentQuestionBase)
  | ({
      kind: 'text';
      correctAnswer: string;
    } & AssessmentQuestionBase)
  | ({
      kind: 'numeric-range';
      min: number;
      max: number;
      unit?: string;
    } & AssessmentQuestionBase)
  | ({
      kind: 'ordering';
      options: string[];
      correctAnswer: string[];
    } & AssessmentQuestionBase);

export interface AssessmentDefinition {
  slug: string;
  version?: 1;
  scope?: AssessmentScope;
  mode?: 'diagnostic' | 'mastery';
  lessonSlug?: string;
  title: string;
  passingScore: number;
  requiredIntents?: AssessmentIntent[];
  questions: AssessmentQuestion[];
}

export interface GradedQuestion {
  questionId: string;
  correct: boolean;
  explanation: string;
  conceptIds: string[];
  intent: AssessmentIntent;
  weight: number;
}

export interface IntentEvidence {
  intent: AssessmentIntent;
  earned: number;
  available: number;
  correctCount: number;
  totalCount: number;
}

export interface AssessmentGrade {
  score: number;
  correctCount: number;
  totalCount: number;
  passed: boolean;
  scorePassed: boolean;
  gatesPassed: boolean;
  diagnostic: boolean;
  missingRequiredIntents: AssessmentIntent[];
  intentEvidence: IntentEvidence[];
  failedConceptIds: string[];
  results: GradedQuestion[];
}

export type LessonStatus = 'not-started' | 'in-progress' | 'completed';
export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';
export type ReviewSourceType =
  | 'lesson'
  | 'reading-note'
  | 'simulation-rubric'
  | 'checkpoint';
export type ReadingStatus = 'planned' | 'reading' | 'paused' | 'completed';

export interface ReadingBook {
  id: string;
  title: string;
  author: string;
  edition?: string;
  totalChapters: number;
  currentChapter: number;
  status: ReadingStatus;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingNote {
  id: string;
  bookId: string;
  chapter?: number;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingBookDetail {
  book: ReadingBook;
  notes: ReadingNote[];
}

export interface LessonProgress {
  lessonSlug: string;
  status: LessonStatus;
  percent: number;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
}

export interface AssessmentAttempt {
  id: string;
  assessmentSlug: string;
  lessonSlug: string;
  assessmentVersion?: 1;
  scope?: AssessmentScope;
  score: number;
  correctCount: number;
  totalCount: number;
  answers: Record<string, string | string[]>;
  failedConceptIds: string[];
  missingRequiredIntents?: AssessmentIntent[];
  durationSeconds: number;
  createdAt: string;
}

export interface ReviewState {
  conceptId: string;
  lessonSlug?: string;
  sourceType?: ReviewSourceType;
  sourceId?: string;
  title?: string;
  prompt?: string;
  answer?: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  lapses: number;
  dueAt: string;
  lastReviewedAt?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  timezone: string;
  updatedAt: string;
}

export interface PushSubscriptionRecord {
  endpoint: string;
  expirationTime: number | null;
  keys: { p256dh: string; auth: string };
}

export interface LearningSnapshot {
  progress: LessonProgress[];
  attempts: AssessmentAttempt[];
  reviews: ReviewState[];
  notificationPreferences: NotificationPreferences;
  focusedPathSlug?: string;
}

export interface CatalogResponse {
  tracks: LearningTrackDefinition[];
  topics: TopicDefinition[];
  lessons: LessonDefinition[];
  learningPaths: LearningPathDefinition[];
  assessments: AssessmentDefinition[];
}

export type LearningRecommendation =
  | { kind: 'review'; href: '/review'; title: string; detail: string }
  | { kind: 'lesson'; href: string; title: string; detail: string };

export interface DashboardResponse {
  snapshot: LearningSnapshot;
  recommendation: LearningRecommendation;
}

export interface RagChunk {
  id: string;
  tech?: Tech;
  domain: CurriculumDomain;
  topic: string;
  step: number;
  content: string;
}

export const SYSTEM_NODE_TYPES = [
  'client',
  'dns',
  'cdn',
  'load-balancer',
  'api-gateway',
  'service',
  'cache',
  'relational-database',
  'document-database',
  'object-storage',
  'queue',
  'stream',
  'worker',
  'search',
  'observability',
  'legacy-system',
  'proxy',
  'database-replica',
  'change-data-capture',
  'feature-flag',
  'backup',
  'firewall',
  'identity-provider',
  'scheduler',
  'data-warehouse',
  'dead-letter-queue',
] as const;

export const SYSTEM_NODE_CONFIG_KEYS = [
  'replicas',
  'tls',
  'durable',
  'cacheTtlSeconds',
  'ttlSeconds',
  'healthChecks',
  'replication',
  'validated',
  'rollbackReady',
  'idempotent',
  'multiRegion',
] as const;

export type SystemNodeType = (typeof SYSTEM_NODE_TYPES)[number];
export type SystemFlowKind =
  | 'request'
  | 'cache'
  | 'write'
  | 'async-job'
  | 'failure'
  | 'recovery'
  | 'replication'
  | 'validation'
  | 'cutover'
  | 'rollback'
  | 'decommission';
export type SystemScenarioCategory =
  | 'system-design'
  | 'migration'
  | 'database'
  | 'reliability';
export type SystemRubricCategory =
  | 'requirements'
  | 'bottlenecks'
  | 'availability'
  | 'latency'
  | 'durability'
  | 'scalability'
  | 'security'
  | 'cost'
  | 'migration-safety'
  | 'trade-offs';

export interface SystemNode {
  id: string;
  type: SystemNodeType;
  label: string;
  x: number;
  y: number;
  config: Record<string, string | number | boolean>;
}

export interface SystemEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface SystemDesignGraph {
  nodes: SystemNode[];
  edges: SystemEdge[];
}

export interface SystemFlowTemplate {
  id: string;
  title: string;
  kind: SystemFlowKind;
  nodeTypes: SystemNodeType[];
  narration: string[];
}

export type SystemRubricCheck =
  | { kind: 'node-present'; nodeType: SystemNodeType; minCount?: number }
  | {
      kind: 'node-count';
      nodeType: SystemNodeType;
      minCount: number;
      maxCount?: number;
    }
  | { kind: 'edge-present'; fromType: SystemNodeType; toType: SystemNodeType }
  | {
      kind: 'labeled-edge';
      fromType: SystemNodeType;
      toType: SystemNodeType;
      label: string;
    }
  | { kind: 'path-exists'; fromType: SystemNodeType; toType: SystemNodeType }
  | { kind: 'config-truthy'; nodeType: SystemNodeType; key: string }
  | {
      kind: 'config-equals';
      nodeType: SystemNodeType;
      key: string;
      value: string | number | boolean;
    }
  | { kind: 'explanation-length'; minLength: number };

export interface SystemRubricRule {
  id: string;
  conceptId: string;
  title: string;
  category: SystemRubricCategory;
  weight: number;
  check: SystemRubricCheck;
  success: string;
  failure: string;
  reviewPrompt: string;
  reviewAnswer: string;
}

export interface SystemDesignScenario {
  slug: string;
  version: number;
  category: SystemScenarioCategory;
  topics: string[];
  estimatedMinutes: number;
  title: string;
  summary: string;
  difficulty: 'foundation' | 'intermediate' | 'advanced';
  goal: string;
  traffic: string[];
  requirements: string[];
  constraints: string[];
  initialGraph: SystemDesignGraph;
  flows: SystemFlowTemplate[];
  phases?: SystemScenarioPhase[];
  rubric: SystemRubricRule[];
}

export interface SystemScenarioPhase {
  id: string;
  title: string;
  goal: string;
  flowIds: string[];
  gate: string;
}

export interface SystemFlowStep {
  nodeId: string;
  edgeId?: string;
  phase: VisualStagePhase;
  label: string;
  narration: string;
}

export type GraphPatchOperation =
  | { op: 'add-node'; node: SystemNode }
  | {
      op: 'update-node';
      nodeId: string;
      changes: {
        label?: string;
        config?: Record<string, string | number | boolean>;
      };
    }
  | { op: 'remove-node'; nodeId: string }
  | { op: 'add-edge'; edge: SystemEdge }
  | { op: 'remove-edge'; edgeId: string };

export interface DesignProposal {
  rationale: string;
  operations: GraphPatchOperation[];
  previewGraph: SystemDesignGraph;
  provider: AIProviderId;
  model: string;
  effort?: AIEffort;
}

export interface SystemDesignDraft {
  id: string;
  scenarioSlug: string;
  name: string;
  graph: SystemDesignGraph;
  updatedAt: string;
}

export interface SystemRubricEvidence {
  ruleId: string;
  conceptId: string;
  title: string;
  category: SystemRubricCategory;
  weight: number;
  passed: boolean;
  evidence: string;
}

export interface SystemDesignEvaluation {
  score: number;
  passed: boolean;
  evidence: SystemRubricEvidence[];
}

export interface SystemDesignAttempt {
  id: string;
  scenarioSlug: string;
  scenarioVersion: number;
  graph: SystemDesignGraph;
  tradeOffs: string;
  evaluation: SystemDesignEvaluation;
  createdAt: string;
}

export const SYSTEM_CHALLENGE_LOAD_PROFILES = [
  'baseline',
  'surge',
  'extreme',
] as const;
export type SystemChallengeLoadProfile =
  (typeof SYSTEM_CHALLENGE_LOAD_PROFILES)[number];

export const SYSTEM_CHALLENGE_FAILURES = [
  'load-spike',
  'dependency-timeout',
  'replica-lag',
  'region-outage',
] as const;
export type SystemChallengeFailure = (typeof SYSTEM_CHALLENGE_FAILURES)[number];

export const SYSTEM_CHALLENGE_EFFECTS = [
  'latency-rise',
  'queue-pressure',
  'availability-loss',
  'stale-read',
  'recovery-path',
  'cutover-risk',
  'throttled-load',
] as const;
export type SystemChallengeEffect = (typeof SYSTEM_CHALLENGE_EFFECTS)[number];

export const SYSTEM_CHALLENGE_METRICS = [
  'latency',
  'availability',
  'queue-pressure',
  'consistency',
  'recovery',
] as const;
export type SystemChallengeMetricName =
  (typeof SYSTEM_CHALLENGE_METRICS)[number];
export type SystemChallengeMetricBand = 'healthy' | 'elevated' | 'critical';

export interface SystemChallengeDefinition {
  id: string;
  version: 1;
  scenarioSlug: string;
  title: string;
  objective: string;
  phaseId?: string;
  constraints: string[];
  predictionOptions: SystemChallengeEffect[];
  loadProfiles: SystemChallengeLoadProfile[];
  failures: SystemChallengeFailure[];
}

export interface SystemChallengeRunRequest {
  scenarioSlug: string;
  challengeId: string;
  graph: SystemDesignGraph;
  phaseId?: string;
  prediction: SystemChallengeEffect;
  loadProfile: SystemChallengeLoadProfile;
  failure: SystemChallengeFailure;
}

export interface SystemChallengeMetric {
  name: SystemChallengeMetricName;
  band: SystemChallengeMetricBand;
  direction: 'stable' | 'up' | 'down';
  observation: string;
}

export interface SystemChallengeStep extends SystemFlowStep {
  metric?: SystemChallengeMetricName;
  band?: SystemChallengeMetricBand;
}

export interface SystemChallengeRunResult {
  challengeId: string;
  challengeVersion: 1;
  scenarioSlug: string;
  phaseId?: string;
  educationalModel: true;
  primaryEffect: SystemChallengeEffect;
  predictionMatches: boolean;
  affectedNodeIds: string[];
  affectedEdgeIds: string[];
  metrics: SystemChallengeMetric[];
  steps: SystemChallengeStep[];
  observations: string[];
  reflectionPrompt: string;
}

export const TUTOR_HELP_LEVELS = [
  'nudge',
  'guided-question',
  'explanation',
] as const;
export type TutorHelpLevel = (typeof TUTOR_HELP_LEVELS)[number];

export interface BubbleSortTutorContext {
  kind: 'bubble-sort';
  lessonSlug: string;
  phase: 'predict' | 'run' | 'feedback' | 'complete';
  items: { id: string; value: number }[];
  selectedItemIds: string[];
  predictedSwap?: boolean;
  predictionCorrect?: boolean;
  narration: string;
}

export interface DesignLabTutorContext {
  kind: 'design-lab';
  scenarioSlug: string;
  phaseId?: string;
  graph: SystemDesignGraph;
  selectedNodeId?: string;
  selectedEdgeId?: string;
  challengeResult?: SystemChallengeRunResult;
  failedRuleIds?: string[];
}

export type TutorSceneContext = BubbleSortTutorContext | DesignLabTutorContext;

export type TutorOverlay =
  | {
      kind: 'highlight-items';
      itemIds: string[];
      label: string;
    }
  | {
      kind: 'highlight-system';
      nodeIds: string[];
      edgeIds: string[];
      label: string;
    }
  | {
      kind: 'focus-phase';
      phaseId: string;
      label: string;
    }
  | {
      kind: 'focus-metric';
      metric: SystemChallengeMetricName;
      label: string;
    };

export interface TutorRequest {
  question: string;
  helpLevel: TutorHelpLevel;
  context: TutorSceneContext;
  citations?: string[];
}

export interface TutorResponse {
  message: string;
  followUpQuestion?: string;
  overlay?: TutorOverlay;
  citations: RagChunk[];
  provider: 'mock' | 'openai';
  cached: boolean;
}

export type ScenarioDraftDifficulty =
  | 'foundation'
  | 'intermediate'
  | 'advanced';

export interface BubbleSortScenarioDraft {
  id: string;
  version: 1;
  kind: 'bubble-sort';
  title: string;
  objective: string;
  difficulty: ScenarioDraftDifficulty;
  values: number[];
  expectedFinal: number[];
}

export interface DesignLabScenarioDraft {
  id: string;
  version: 1;
  kind: 'design-lab';
  title: string;
  objective: string;
  difficulty: ScenarioDraftDifficulty;
  scenarioSlug: string;
  challengeId: string;
  loadProfile: SystemChallengeLoadProfile;
  failure: SystemChallengeFailure;
  predictionOptions: SystemChallengeEffect[];
  expectedPrimaryEffect: SystemChallengeEffect;
}

export type LearningScenarioDraft =
  | BubbleSortScenarioDraft
  | DesignLabScenarioDraft;

export type ScenarioEvalCategory =
  | 'schema'
  | 'bounds'
  | 'references'
  | 'solvability'
  | 'state-consistency'
  | 'impossible-states'
  | 'visual-clarity';

export interface ScenarioEvalCheck {
  id: string;
  category: ScenarioEvalCategory;
  status: 'pass' | 'fail';
  blocking: boolean;
  evidence: string;
  subjectIds?: string[];
}

export interface ScenarioEvalReport {
  suiteVersion: 1;
  draftDigest: string;
  passed: boolean;
  humanReviewRequired: true;
  checks: ScenarioEvalCheck[];
}

export interface ScenarioDraftGenerationRequest {
  kind: LearningScenarioDraft['kind'];
  objective: string;
  difficulty: ScenarioDraftDifficulty;
}

export interface ScenarioDraftResult {
  draft: LearningScenarioDraft;
  report: ScenarioEvalReport;
  provider: 'mock' | 'openai';
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

export function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  if (!value || typeof value !== 'object' || !('error' in value)) return false;
  const error = (value as { error?: unknown }).error;
  return Boolean(
    error &&
      typeof error === 'object' &&
      typeof (error as { code?: unknown }).code === 'string' &&
      typeof (error as { message?: unknown }).message === 'string' &&
      typeof (error as { retryable?: unknown }).retryable === 'boolean',
  );
}
