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
  | 'two-pointers'
  | 'sliding-window'
  | 'bfs-grid'
  | 'dfs-grid'
  | 'concept-flow';

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
  label: string;
  narration: string;
  metric?: string;
  activeNodeIds: string[];
  activeConnectionIndexes?: number[];
}

export interface ConceptFlowNarrative {
  nodes: ConceptFlowNode[];
  connections: ConceptFlowConnection[];
  steps: ConceptFlowStep[];
}

export interface TopicDefinition {
  slug: string;
  title: string;
  description: string;
  domain: CurriculumDomain;
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
}

export type AssessmentQuestion =
  | {
      id: string;
      kind: 'multiple-choice' | 'text';
      prompt: string;
      options?: string[];
      correctAnswer: string;
      explanation: string;
      conceptIds: string[];
    }
  | {
      id: string;
      kind: 'ordering';
      prompt: string;
      options: string[];
      correctAnswer: string[];
      explanation: string;
      conceptIds: string[];
    };

export interface AssessmentDefinition {
  slug: string;
  lessonSlug: string;
  title: string;
  passingScore: number;
  questions: AssessmentQuestion[];
}

export interface GradedQuestion {
  questionId: string;
  correct: boolean;
  explanation: string;
  conceptIds: string[];
}

export interface AssessmentGrade {
  score: number;
  correctCount: number;
  totalCount: number;
  passed: boolean;
  failedConceptIds: string[];
  results: GradedQuestion[];
}

export type LessonStatus = 'not-started' | 'in-progress' | 'completed';
export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';
export type ReviewSourceType = 'lesson' | 'reading-note' | 'simulation-rubric';
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
  score: number;
  correctCount: number;
  totalCount: number;
  answers: Record<string, string | string[]>;
  failedConceptIds: string[];
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
