import type {
  AssessmentDefinition,
  ConceptFlowNarrative,
  CurriculumDomain,
  LearningLevel,
  LearningPathDefinition,
  LearningTrackDefinition,
  LessonDefinition,
  PathModuleDefinition,
  TopicDefinition,
} from '@algoflow/contracts';

export const tracks: LearningTrackDefinition[] = [
  {
    slug: 'algorithms',
    title: 'Algorithms',
    description:
      'Build reusable problem-solving models through visible execution.',
    outcomes: [
      'Analyze growth',
      'Recognize reusable patterns',
      'Trace graph traversal',
    ],
    pathSlugs: ['algorithm-foundations', 'array-patterns', 'graph-traversal'],
    order: 1,
  },
  {
    slug: 'engineering-foundations',
    title: 'Engineering Foundations',
    description:
      'Understand how software work moves from an idea to a reliable system.',
    outcomes: [
      'Reason across system layers',
      'Use core engineering vocabulary',
      'Choose deliberate trade-offs',
    ],
    pathSlugs: ['software-engineering-fundamentals', 'general-mathematics'],
    order: 2,
  },
  {
    slug: 'languages',
    title: 'Languages',
    description: 'Develop durable mental models for JavaScript and Go.',
    outcomes: [
      'Explain runtime behavior',
      'Write idiomatic programs',
      'Compare language trade-offs',
    ],
    pathSlugs: ['javascript', 'go'],
    order: 3,
  },
  {
    slug: 'software-architecture',
    title: 'Software Architecture',
    description: 'Design maintainable code and scalable distributed systems.',
    outcomes: [
      'Apply design patterns',
      'Model system boundaries',
      'Reason about network delivery',
    ],
    pathSlugs: ['design-patterns', 'system-design', 'networking-cdn'],
    order: 4,
  },
  {
    slug: 'data',
    title: 'Data',
    description: 'Model, query, and operate relational data deliberately.',
    outcomes: [
      'Design relational schemas',
      'Explain query trade-offs',
      'Operate PostgreSQL and MySQL',
    ],
    pathSlugs: ['database-fundamentals', 'postgresql', 'mysql'],
    order: 5,
  },
  {
    slug: 'cloud-platform',
    title: 'Cloud & Platform',
    description:
      'Package, deploy, and operate software on modern infrastructure.',
    outcomes: [
      'Build container images',
      'Reason about orchestration',
      'Use AWS primitives',
    ],
    pathSlugs: ['docker', 'kubernetes', 'aws'],
    order: 6,
  },
  {
    slug: 'ai-foundations',
    title: 'AI Foundations',
    description:
      'Connect mathematics, machine learning, and deep learning concepts.',
    outcomes: [
      'Use mathematical representations',
      'Explain learning workflows',
      'Reason about neural models',
    ],
    pathSlugs: ['mathematics-for-ai', 'machine-learning', 'deep-learning'],
    order: 7,
  },
  {
    slug: 'ai-engineering',
    title: 'AI Engineering',
    description:
      'Build reliable products around models, tools, retrieval, and agents.',
    outcomes: [
      'Collaborate with coding AI',
      'Ground LLM applications',
      'Design evaluated agent loops',
    ],
    pathSlugs: [
      'ai-assisted-development',
      'llm-application-engineering',
      'agentic-engineering',
    ],
    order: 8,
  },
  {
    slug: 'communication-learning',
    title: 'Communication & Learning',
    description:
      'Read, communicate, and retain technical knowledge effectively.',
    outcomes: [
      'Read technical English',
      'Extract knowledge from books',
      'Practice spaced learning',
    ],
    pathSlugs: [
      'technical-english',
      'technical-reading',
      'learning-how-to-learn',
    ],
    order: 9,
  },
];

export const topics: TopicDefinition[] = [
  {
    slug: 'complexity',
    title: 'Complexity',
    description:
      'Reason about how running time and memory grow with input size.',
    domain: 'algorithms',
  },
  {
    slug: 'sorting',
    title: 'Sorting',
    description:
      'Understand ordering through comparisons, movement, and invariants.',
    domain: 'algorithms',
  },
  {
    slug: 'array-patterns',
    title: 'Array Patterns',
    description:
      'Reuse pointer and window patterns instead of starting from scratch.',
    domain: 'algorithms',
  },
  {
    slug: 'graphs',
    title: 'Graphs',
    description:
      'Explore connected structures with breadth-first and depth-first traversal.',
    domain: 'algorithms',
  },
  {
    slug: 'software-systems',
    title: 'Software Systems',
    description:
      'Connect clients, services, data, and operations into one mental model.',
    domain: 'engineering',
  },
  {
    slug: 'language-runtime',
    title: 'Language Runtime',
    description:
      'Explain what happens between source code and observable behavior.',
    domain: 'languages',
  },
  {
    slug: 'distributed-systems',
    title: 'Distributed Systems',
    description: 'Trace requests across networks, caches, and origins.',
    domain: 'architecture',
  },
  {
    slug: 'relational-data',
    title: 'Relational Data',
    description: 'Model entities, relationships, constraints, and queries.',
    domain: 'data',
  },
  {
    slug: 'containers',
    title: 'Containers',
    description: 'Package applications into reproducible runtime units.',
    domain: 'cloud',
  },
  {
    slug: 'ai-mathematics',
    title: 'AI Mathematics',
    description: 'Use vectors and transformations to represent model inputs.',
    domain: 'ai-foundations',
  },
  {
    slug: 'agent-systems',
    title: 'Agent Systems',
    description: 'Coordinate models, tools, state, and evaluation loops.',
    domain: 'ai-engineering',
  },
  {
    slug: 'technical-learning',
    title: 'Technical Learning',
    description: 'Turn reading into durable, testable understanding.',
    domain: 'communication',
  },
];

function conceptFlow(labels: string[], metric: string): ConceptFlowNarrative {
  return {
    nodes: labels.map((label, index) => ({ id: `node-${index + 1}`, label })),
    connections: labels.slice(1).map((_, index) => ({
      from: `node-${index + 1}`,
      to: `node-${index + 2}`,
    })),
    steps: labels.map((label, index) => ({
      label: `Step ${index + 1}`,
      narration: `${label} becomes the active part of the model. Connect it to the previous step before continuing.`,
      metric,
      activeNodeIds: [`node-${index + 1}`],
      activeConnectionIndexes: index === 0 ? [] : [index - 1],
    })),
  };
}

export const lessons: LessonDefinition[] = [
  {
    slug: 'complexity-basics-js',
    title: 'Complexity Basics',
    summary:
      'Build an intuition for O(1), O(n), and O(n²) before comparing algorithms.',
    tech: 'js',
    domain: 'algorithms',
    topicSlug: 'complexity',
    conceptIds: ['growth-rates', 'big-o'],
    estimatedMinutes: 12,
    visualization: 'complexity',
    codeLanguage: 'javascript',
    assessmentSlug: 'complexity-basics-checkpoint',
    prerequisites: [],
  },
  {
    slug: 'bubble-sort-js',
    title: 'Bubble Sort',
    summary:
      'Trace adjacent comparisons and see the sorted boundary grow after every pass.',
    tech: 'js',
    domain: 'algorithms',
    topicSlug: 'sorting',
    conceptIds: ['adjacent-comparison', 'sorting-invariant'],
    estimatedMinutes: 18,
    visualization: 'bubble-sort',
    codeLanguage: 'javascript',
    assessmentSlug: 'bubble-sort-checkpoint',
    prerequisites: ['complexity-basics-js'],
  },
  {
    slug: 'two-pointers-js',
    title: 'Two Pointers',
    summary:
      'Coordinate two indices to replace nested scans with a single structured pass.',
    tech: 'js',
    domain: 'algorithms',
    topicSlug: 'array-patterns',
    conceptIds: ['pointer-invariant', 'linear-scan'],
    estimatedMinutes: 16,
    visualization: 'two-pointers',
    codeLanguage: 'javascript',
    assessmentSlug: 'two-pointers-checkpoint',
    prerequisites: ['complexity-basics-js'],
  },
  {
    slug: 'sliding-window-ts',
    title: 'Sliding Window',
    summary:
      'Maintain a useful subarray while moving its boundaries in linear time.',
    tech: 'ts',
    domain: 'algorithms',
    topicSlug: 'array-patterns',
    conceptIds: ['window-invariant', 'incremental-state'],
    estimatedMinutes: 20,
    visualization: 'sliding-window',
    codeLanguage: 'typescript',
    assessmentSlug: 'sliding-window-checkpoint',
    prerequisites: ['two-pointers-js'],
  },
  {
    slug: 'bfs-grid-go',
    title: 'BFS Grid',
    summary:
      'Use a queue to explore a grid layer by layer and find shortest unweighted paths.',
    tech: 'go',
    domain: 'algorithms',
    topicSlug: 'graphs',
    conceptIds: ['queue-frontier', 'visited-set'],
    estimatedMinutes: 22,
    visualization: 'bfs-grid',
    codeLanguage: 'go',
    assessmentSlug: 'bfs-grid-checkpoint',
    prerequisites: ['complexity-basics-js'],
  },
  {
    slug: 'dfs-grid-go',
    title: 'DFS Grid',
    summary:
      'Follow one branch deeply, backtrack, and compare the traversal with BFS.',
    tech: 'go',
    domain: 'algorithms',
    topicSlug: 'graphs',
    conceptIds: ['stack-frontier', 'visited-set'],
    estimatedMinutes: 20,
    visualization: 'dfs-grid',
    codeLanguage: 'go',
    assessmentSlug: 'dfs-grid-checkpoint',
    prerequisites: ['bfs-grid-go'],
  },
  {
    slug: 'software-systems-map',
    title: 'How Software Systems Fit Together',
    summary:
      'Trace one user action through interface, service, data, and operational feedback.',
    tech: 'general',
    domain: 'engineering',
    topicSlug: 'software-systems',
    conceptIds: ['system-boundaries', 'feedback-loop'],
    estimatedMinutes: 18,
    visualization: 'concept-flow',
    conceptFlow: conceptFlow(
      ['User interface', 'Application service', 'Data store', 'Observability'],
      'One request, four responsibilities',
    ),
    assessmentSlug: 'software-systems-checkpoint',
    prerequisites: [],
  },
  {
    slug: 'javascript-execution-model',
    title: 'JavaScript Execution Model',
    summary:
      'Follow source code through the call stack, Web APIs, queues, and the event loop.',
    tech: 'js',
    domain: 'languages',
    topicSlug: 'language-runtime',
    conceptIds: ['call-stack', 'event-loop'],
    estimatedMinutes: 20,
    visualization: 'concept-flow',
    codeLanguage: 'javascript',
    conceptFlow: conceptFlow(
      ['Call stack', 'Web API', 'Task queue', 'Event loop'],
      'Run-to-completion',
    ),
    assessmentSlug: 'javascript-runtime-checkpoint',
    prerequisites: [],
  },
  {
    slug: 'request-to-cdn',
    title: 'From Request to CDN',
    summary:
      'See how DNS, edge caches, and an origin cooperate to deliver content globally.',
    tech: 'general',
    domain: 'architecture',
    topicSlug: 'distributed-systems',
    conceptIds: ['cache-boundary', 'origin-fallback'],
    estimatedMinutes: 22,
    visualization: 'concept-flow',
    conceptFlow: conceptFlow(
      ['Client', 'DNS', 'CDN edge', 'Origin'],
      'Latency falls near the user',
    ),
    assessmentSlug: 'request-cdn-checkpoint',
    prerequisites: [],
  },
  {
    slug: 'relational-data-modeling',
    title: 'Relational Data Modeling',
    summary:
      'Turn product concepts into tables, keys, relationships, and enforced constraints.',
    tech: 'sql',
    domain: 'data',
    topicSlug: 'relational-data',
    conceptIds: ['primary-key', 'foreign-key'],
    estimatedMinutes: 22,
    visualization: 'concept-flow',
    codeLanguage: 'sql',
    conceptFlow: conceptFlow(
      ['Entity', 'Primary key', 'Relationship', 'Constraint'],
      'Integrity before convenience',
    ),
    assessmentSlug: 'relational-modeling-checkpoint',
    prerequisites: [],
  },
  {
    slug: 'containers-and-images',
    title: 'Containers and Images',
    summary:
      'Separate immutable image layers from the running container process.',
    tech: 'general',
    domain: 'cloud',
    topicSlug: 'containers',
    conceptIds: ['image-layer', 'container-runtime'],
    estimatedMinutes: 18,
    visualization: 'concept-flow',
    conceptFlow: conceptFlow(
      ['Source', 'Image layers', 'Container', 'Runtime boundary'],
      'Build once, run consistently',
    ),
    assessmentSlug: 'containers-images-checkpoint',
    prerequisites: [],
  },
  {
    slug: 'vectors-for-machine-learning',
    title: 'Vectors for Machine Learning',
    summary:
      'Represent examples as coordinates and interpret distance, direction, and transformation.',
    tech: 'python',
    domain: 'ai-foundations',
    topicSlug: 'ai-mathematics',
    conceptIds: ['vector-representation', 'dot-product'],
    estimatedMinutes: 24,
    visualization: 'concept-flow',
    codeLanguage: 'python',
    conceptFlow: conceptFlow(
      ['Features', 'Vector', 'Transformation', 'Similarity'],
      'Geometry becomes computation',
    ),
    assessmentSlug: 'vectors-ml-checkpoint',
    prerequisites: [],
  },
  {
    slug: 'prompt-to-agent-loop',
    title: 'From Prompt to Agent Loop',
    summary:
      'Connect goals, model decisions, tool calls, observations, and evaluation.',
    tech: 'general',
    domain: 'ai-engineering',
    topicSlug: 'agent-systems',
    conceptIds: ['tool-loop', 'agent-evaluation'],
    estimatedMinutes: 24,
    visualization: 'concept-flow',
    conceptFlow: conceptFlow(
      ['Goal', 'Model decision', 'Tool call', 'Observation', 'Evaluation'],
      'Bounded autonomy with evidence',
    ),
    assessmentSlug: 'agent-loop-checkpoint',
    prerequisites: [],
  },
  {
    slug: 'active-technical-reading',
    title: 'Read Technical Material Actively',
    summary:
      'Convert chapters into questions, retrieval prompts, and experiments you can revisit.',
    tech: 'en',
    domain: 'communication',
    topicSlug: 'technical-learning',
    conceptIds: ['active-recall', 'reading-synthesis'],
    estimatedMinutes: 18,
    visualization: 'concept-flow',
    conceptFlow: conceptFlow(
      ['Preview', 'Question', 'Read', 'Recall', 'Apply'],
      'Reading produces evidence',
    ),
    assessmentSlug: 'technical-reading-checkpoint',
    prerequisites: [],
  },
];

function available(lessonSlug: string): PathModuleDefinition {
  const lesson = lessons.find((candidate) => candidate.slug === lessonSlug)!;
  return {
    id: lessonSlug,
    title: lesson.title,
    summary: lesson.summary,
    status: 'available',
    lessonSlug,
    estimatedMinutes: lesson.estimatedMinutes,
  };
}

function planned(
  id: string,
  title: string,
  summary: string,
  estimatedMinutes = 45,
): PathModuleDefinition {
  return { id, title, summary, status: 'planned', estimatedMinutes };
}

function practice(
  id: string,
  title: string,
  summary: string,
  href: string,
  estimatedMinutes = 45,
): PathModuleDefinition {
  return { id, title, summary, status: 'practice', href, estimatedMinutes };
}

function path(input: {
  slug: string;
  title: string;
  description: string;
  trackSlug: string;
  level?: LearningLevel;
  outcomes: string[];
  prerequisites?: string[];
  modules: PathModuleDefinition[];
}): LearningPathDefinition {
  return {
    ...input,
    level: input.level ?? 'foundation',
    prerequisitePathSlugs: input.prerequisites ?? [],
    lessonSlugs: input.modules
      .filter(
        (
          pathModule,
        ): pathModule is Extract<
          PathModuleDefinition,
          { status: 'available' }
        > => pathModule.status === 'available',
      )
      .map((pathModule) => pathModule.lessonSlug),
    estimatedMinutes: input.modules.reduce(
      (total, pathModule) => total + pathModule.estimatedMinutes,
      0,
    ),
  };
}

const roadmap = (
  id: string,
  title: string,
  summary: string,
  estimatedMinutes = 45,
) => planned(id, title, summary, estimatedMinutes);

export const learningPaths: LearningPathDefinition[] = [
  path({
    slug: 'algorithm-foundations',
    title: 'Algorithm Foundations',
    description:
      'Start with growth, then connect sorting, array patterns, and traversal.',
    trackSlug: 'algorithms',
    outcomes: [
      'Compare growth rates',
      'Trace sorting invariants',
      'Use graph frontiers',
    ],
    modules: [
      available('complexity-basics-js'),
      available('bubble-sort-js'),
      available('two-pointers-js'),
      available('bfs-grid-go'),
    ],
  }),
  path({
    slug: 'array-patterns',
    title: 'Array Patterns',
    description:
      'Practice index-based patterns that unlock many interview problems.',
    trackSlug: 'algorithms',
    outcomes: [
      'Maintain pointer invariants',
      'Update window state incrementally',
    ],
    prerequisites: ['algorithm-foundations'],
    modules: [available('two-pointers-js'), available('sliding-window-ts')],
  }),
  path({
    slug: 'graph-traversal',
    title: 'Graph Traversal',
    description:
      'Compare queue and stack frontiers on the same grid mental model.',
    trackSlug: 'algorithms',
    outcomes: ['Choose BFS or DFS', 'Track visited state'],
    prerequisites: ['algorithm-foundations'],
    modules: [available('bfs-grid-go'), available('dfs-grid-go')],
  }),
  path({
    slug: 'software-engineering-fundamentals',
    title: 'Software Engineering Fundamentals',
    description:
      'Build a systems-level model of professional software delivery.',
    trackSlug: 'engineering-foundations',
    outcomes: [
      'Map system responsibilities',
      'Use feedback loops',
      'Reason about reliability',
    ],
    modules: [
      available('software-systems-map'),
      roadmap(
        'requirements-delivery',
        'Requirements to Delivery',
        'Translate problems into incremental, verifiable software.',
      ),
      roadmap(
        'reliability-basics',
        'Reliability Basics',
        'Use failure modes, telemetry, and recovery boundaries.',
      ),
    ],
  }),
  path({
    slug: 'general-mathematics',
    title: 'General Mathematics',
    description: 'Refresh the mathematical language used across engineering.',
    trackSlug: 'engineering-foundations',
    outcomes: [
      'Manipulate algebraic expressions',
      'Reason with functions',
      'Use probability',
    ],
    modules: [
      roadmap(
        'algebra-functions',
        'Algebra and Functions',
        'Build fluency with variables, functions, and graphs.',
      ),
      roadmap(
        'probability-basics',
        'Probability Basics',
        'Reason about uncertainty and conditional events.',
      ),
      roadmap(
        'discrete-math',
        'Discrete Mathematics',
        'Use sets, logic, relations, and combinatorics.',
      ),
    ],
  }),
  path({
    slug: 'javascript',
    title: 'JavaScript',
    description:
      'Understand JavaScript from runtime semantics to production patterns.',
    trackSlug: 'languages',
    outcomes: [
      'Explain the event loop',
      'Use modern language features',
      'Design reliable async code',
    ],
    modules: [
      available('javascript-execution-model'),
      roadmap(
        'js-types-closures',
        'Types, Scope, and Closures',
        'Connect lexical scope to program behavior.',
      ),
      roadmap(
        'js-async-patterns',
        'Async JavaScript',
        'Control promises, cancellation, and concurrency.',
      ),
    ],
  }),
  path({
    slug: 'go',
    title: 'Go',
    description: 'Develop clear, concurrent services with Go.',
    trackSlug: 'languages',
    outcomes: [
      'Use Go types and interfaces',
      'Coordinate goroutines',
      'Build HTTP services',
    ],
    modules: [
      roadmap(
        'go-language-core',
        'Go Language Core',
        'Learn values, methods, interfaces, and errors.',
      ),
      roadmap(
        'go-concurrency',
        'Go Concurrency',
        'Coordinate goroutines with channels and context.',
      ),
      roadmap(
        'go-services',
        'Go Services',
        'Build observable HTTP and worker services.',
      ),
    ],
  }),
  path({
    slug: 'design-patterns',
    title: 'Design Patterns',
    description: 'Apply patterns as named trade-offs rather than recipes.',
    trackSlug: 'software-architecture',
    level: 'intermediate',
    outcomes: [
      'Recognize structural forces',
      'Choose behavioral patterns',
      'Avoid pattern overuse',
    ],
    modules: [
      roadmap(
        'pattern-forces',
        'Forces Before Patterns',
        'Identify what must vary and what must remain stable.',
      ),
      roadmap(
        'creational-structural',
        'Creational and Structural Patterns',
        'Compare factories, adapters, decorators, and composites.',
      ),
      roadmap(
        'behavioral-patterns',
        'Behavioral Patterns',
        'Coordinate state, strategy, commands, and events.',
      ),
    ],
  }),
  path({
    slug: 'system-design',
    title: 'System Design',
    description:
      'Design and evaluate scalable systems through animated scenarios.',
    trackSlug: 'software-architecture',
    level: 'intermediate',
    outcomes: [
      'Clarify requirements',
      'Compose system blocks',
      'Evaluate capacity and resilience',
    ],
    prerequisites: ['networking-cdn', 'database-fundamentals'],
    modules: [
      practice(
        'cdn-delivery-simulation',
        'Global CDN Delivery',
        'Design a low-latency static delivery path.',
        '/simulations/global-cdn-delivery',
        45,
      ),
      practice(
        'url-shortener-simulation',
        'Scalable URL Shortener',
        'Balance read latency, uniqueness, and durable redirects.',
        '/simulations/url-shortener',
        55,
      ),
      practice(
        'file-processing-simulation',
        'Async File Processing',
        'Decouple uploads from durable background work.',
        '/simulations/async-file-processing',
        55,
      ),
      roadmap(
        'reliability-tradeoffs',
        'Reliability Trade-offs',
        'Reason about replication, queues, and failure domains.',
      ),
    ],
  }),
  path({
    slug: 'networking-cdn',
    title: 'Networking for Software Engineers',
    description:
      'Follow requests through DNS, HTTP, TLS, load balancing, and CDNs.',
    trackSlug: 'software-architecture',
    outcomes: [
      'Trace network requests',
      'Explain edge caching',
      'Choose delivery boundaries',
    ],
    modules: [
      available('request-to-cdn'),
      roadmap(
        'http-tls',
        'HTTP and TLS',
        'Understand transport, encryption, and connection reuse.',
      ),
      roadmap(
        'load-balancing',
        'Load Balancing',
        'Distribute traffic with health and affinity trade-offs.',
      ),
    ],
  }),
  path({
    slug: 'database-fundamentals',
    title: 'Database Fundamentals',
    description:
      'Model data and reason about transactions, indexes, and queries.',
    trackSlug: 'data',
    outcomes: [
      'Design relational schemas',
      'Use transactions',
      'Select useful indexes',
    ],
    modules: [
      available('relational-data-modeling'),
      roadmap(
        'transactions-isolation',
        'Transactions and Isolation',
        'Protect invariants under concurrent work.',
      ),
      roadmap(
        'indexes-query-plans',
        'Indexes and Query Plans',
        'Connect access paths to query cost.',
      ),
    ],
  }),
  path({
    slug: 'postgresql',
    title: 'PostgreSQL',
    description: 'Operate PostgreSQL with confidence from SQL to production.',
    trackSlug: 'data',
    level: 'intermediate',
    outcomes: [
      'Use PostgreSQL data types',
      'Read query plans',
      'Plan safe operations',
    ],
    prerequisites: ['database-fundamentals'],
    modules: [
      roadmap(
        'postgres-types',
        'PostgreSQL Data Types',
        'Choose precise native representations.',
      ),
      roadmap(
        'postgres-explain',
        'EXPLAIN and Indexing',
        'Diagnose query plans and access paths.',
      ),
      roadmap(
        'postgres-operations',
        'PostgreSQL Operations',
        'Back up, monitor, and migrate safely.',
      ),
    ],
  }),
  path({
    slug: 'mysql',
    title: 'MySQL',
    description: 'Use MySQL storage, indexes, and replication deliberately.',
    trackSlug: 'data',
    level: 'intermediate',
    outcomes: ['Model InnoDB data', 'Tune queries', 'Explain replication'],
    prerequisites: ['database-fundamentals'],
    modules: [
      roadmap(
        'mysql-innodb',
        'InnoDB Fundamentals',
        'Understand clustered storage and transactions.',
      ),
      roadmap(
        'mysql-query-plans',
        'MySQL Query Plans',
        'Inspect and improve access paths.',
      ),
      roadmap(
        'mysql-replication',
        'MySQL Replication',
        'Reason about lag, failover, and consistency.',
      ),
    ],
  }),
  path({
    slug: 'docker',
    title: 'Docker',
    description: 'Build small, reproducible, and secure container images.',
    trackSlug: 'cloud-platform',
    outcomes: [
      'Distinguish images and containers',
      'Write effective Dockerfiles',
      'Use container networks',
    ],
    modules: [
      available('containers-and-images'),
      roadmap(
        'dockerfile-layers',
        'Dockerfile Layers',
        'Optimize caching, size, and reproducibility.',
      ),
      roadmap(
        'docker-compose-networking',
        'Compose and Networking',
        'Connect local services with explicit boundaries.',
      ),
    ],
  }),
  path({
    slug: 'kubernetes',
    title: 'Kubernetes',
    description:
      'Run containerized workloads through declarative orchestration.',
    trackSlug: 'cloud-platform',
    level: 'intermediate',
    outcomes: [
      'Explain core objects',
      'Roll out safely',
      'Debug service networking',
    ],
    prerequisites: ['docker'],
    modules: [
      roadmap(
        'kubernetes-objects',
        'Kubernetes Objects',
        'Connect pods, deployments, services, and configuration.',
      ),
      roadmap(
        'kubernetes-rollouts',
        'Rollouts and Health',
        'Use probes, strategies, and resource controls.',
      ),
      roadmap(
        'kubernetes-networking',
        'Kubernetes Networking',
        'Trace traffic through service discovery and ingress.',
      ),
    ],
  }),
  path({
    slug: 'aws',
    title: 'AWS',
    description: 'Compose AWS services around security, reliability, and cost.',
    trackSlug: 'cloud-platform',
    level: 'intermediate',
    outcomes: [
      'Use IAM boundaries',
      'Choose compute and storage',
      'Design observable workloads',
    ],
    prerequisites: ['networking-cdn'],
    modules: [
      roadmap(
        'aws-iam-networking',
        'IAM and Networking',
        'Establish identity and network boundaries.',
      ),
      roadmap(
        'aws-compute-storage',
        'Compute and Storage',
        'Choose among serverless, containers, object, and block storage.',
      ),
      roadmap(
        'aws-reliability-cost',
        'Reliability and Cost',
        'Design multi-AZ recovery and cost controls.',
      ),
    ],
  }),
  path({
    slug: 'mathematics-for-ai',
    title: 'Mathematics for AI',
    description:
      'Connect linear algebra, calculus, probability, and optimization to models.',
    trackSlug: 'ai-foundations',
    outcomes: [
      'Represent data as vectors',
      'Interpret gradients',
      'Reason about uncertainty',
    ],
    modules: [
      available('vectors-for-machine-learning'),
      roadmap(
        'calculus-gradients',
        'Calculus and Gradients',
        'Connect derivatives to model updates.',
      ),
      roadmap(
        'probability-statistics-ai',
        'Probability for AI',
        'Model uncertainty and evaluate evidence.',
      ),
    ],
  }),
  path({
    slug: 'machine-learning',
    title: 'Machine Learning',
    description: 'Train and evaluate supervised and unsupervised models.',
    trackSlug: 'ai-foundations',
    level: 'intermediate',
    outcomes: [
      'Build an ML workflow',
      'Prevent leakage',
      'Evaluate generalization',
    ],
    prerequisites: ['mathematics-for-ai'],
    modules: [
      roadmap(
        'ml-workflow',
        'The ML Workflow',
        'Move from data and baseline to evaluated model.',
      ),
      roadmap(
        'supervised-learning',
        'Supervised Learning',
        'Compare regression, trees, and classification.',
      ),
      roadmap(
        'ml-evaluation',
        'Evaluation and Generalization',
        'Use splits, metrics, and error analysis.',
      ),
    ],
  }),
  path({
    slug: 'deep-learning',
    title: 'Deep Learning',
    description:
      'Understand neural networks, training dynamics, and modern architectures.',
    trackSlug: 'ai-foundations',
    level: 'advanced',
    outcomes: [
      'Explain backpropagation',
      'Choose architectures',
      'Debug training',
    ],
    prerequisites: ['machine-learning'],
    modules: [
      roadmap(
        'neural-networks',
        'Neural Networks',
        'Compose layers, activations, and losses.',
      ),
      roadmap(
        'backprop-optimization',
        'Backpropagation and Optimization',
        'Trace gradients and update parameters.',
      ),
      roadmap(
        'transformer-foundations',
        'Transformer Foundations',
        'Understand attention and sequence modeling.',
      ),
    ],
  }),
  path({
    slug: 'ai-assisted-development',
    title: 'AI-Assisted Development',
    description:
      'Use coding AI with clear specifications, evidence, and review.',
    trackSlug: 'ai-engineering',
    outcomes: [
      'Write bounded prompts',
      'Verify generated changes',
      'Use AI in delivery loops',
    ],
    modules: [
      roadmap(
        'ai-coding-loop',
        'The AI Coding Loop',
        'Specify, implement, test, and review with evidence.',
      ),
      roadmap(
        'context-engineering',
        'Context Engineering',
        'Provide the smallest complete working context.',
      ),
      roadmap(
        'ai-code-review',
        'AI-Assisted Review',
        'Combine automated review with human judgment.',
      ),
    ],
  }),
  path({
    slug: 'llm-application-engineering',
    title: 'LLM Application Engineering',
    description: 'Build grounded, observable, and evaluated LLM features.',
    trackSlug: 'ai-engineering',
    level: 'intermediate',
    outcomes: [
      'Design prompts and schemas',
      'Build RAG',
      'Evaluate model behavior',
    ],
    prerequisites: ['ai-assisted-development'],
    modules: [
      roadmap(
        'structured-generation',
        'Structured Generation',
        'Constrain model outputs to application contracts.',
      ),
      roadmap(
        'rag-systems',
        'Retrieval-Augmented Generation',
        'Retrieve, ground, cite, and evaluate context.',
      ),
      roadmap(
        'llm-evaluation',
        'LLM Evaluation',
        'Measure task quality, safety, latency, and cost.',
      ),
    ],
  }),
  path({
    slug: 'agentic-engineering',
    title: 'Agentic Engineering',
    description:
      'Build bounded agents that use tools and produce verifiable evidence.',
    trackSlug: 'ai-engineering',
    level: 'advanced',
    outcomes: ['Design agent loops', 'Constrain tool use', 'Evaluate autonomy'],
    prerequisites: ['llm-application-engineering'],
    modules: [
      available('prompt-to-agent-loop'),
      roadmap(
        'agent-tools-state',
        'Tools and State',
        'Define capabilities, memory boundaries, and recovery.',
      ),
      roadmap(
        'agent-evals-safety',
        'Agent Evaluation and Safety',
        'Test trajectories, permissions, and stop conditions.',
      ),
    ],
  }),
  path({
    slug: 'technical-english',
    title: 'Technical English',
    description:
      'Read, write, and discuss software concepts precisely in English.',
    trackSlug: 'communication-learning',
    outcomes: [
      'Use engineering vocabulary',
      'Read specifications',
      'Write concise technical explanations',
    ],
    modules: [
      roadmap(
        'english-vocabulary',
        'Technical Vocabulary',
        'Build high-frequency software and systems vocabulary.',
      ),
      roadmap(
        'reading-specifications',
        'Reading Specifications',
        'Parse normative language, constraints, and examples.',
      ),
      roadmap(
        'writing-technical-english',
        'Writing Technical English',
        'Explain decisions with clarity and evidence.',
      ),
    ],
  }),
  path({
    slug: 'technical-reading',
    title: 'Technical Reading',
    description: 'Turn technical books and papers into reusable understanding.',
    trackSlug: 'communication-learning',
    outcomes: [
      'Preview strategically',
      'Take useful notes',
      'Convert reading into retrieval practice',
    ],
    modules: [
      available('active-technical-reading'),
      roadmap(
        'chapter-synthesis',
        'Chapter Synthesis',
        'Write a compact model instead of copying passages.',
      ),
      roadmap(
        'reading-to-experiment',
        'Reading to Experiment',
        'Validate claims with code or system observations.',
      ),
    ],
  }),
  path({
    slug: 'learning-how-to-learn',
    title: 'Learning How to Learn',
    description:
      'Use retrieval, spacing, interleaving, and feedback deliberately.',
    trackSlug: 'communication-learning',
    outcomes: [
      'Plan spaced practice',
      'Use active recall',
      'Calibrate confidence',
    ],
    modules: [
      roadmap(
        'retrieval-practice',
        'Retrieval Practice',
        'Test memory before reviewing material.',
      ),
      roadmap(
        'spacing-interleaving',
        'Spacing and Interleaving',
        'Schedule varied practice over time.',
      ),
      roadmap(
        'feedback-metacognition',
        'Feedback and Metacognition',
        'Compare confidence with actual evidence.',
      ),
    ],
  }),
];

const existingAssessments: AssessmentDefinition[] = [
  {
    slug: 'complexity-basics-checkpoint',
    lessonSlug: 'complexity-basics-js',
    title: 'Complexity Basics Checkpoint',
    passingScore: 70,
    questions: [
      {
        id: 'complexity-growth',
        kind: 'multiple-choice',
        prompt: 'Which growth rate becomes expensive fastest as n grows?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
        correctAnswer: 'O(n²)',
        explanation: 'Quadratic work grows with the square of input size.',
        conceptIds: ['growth-rates'],
      },
      {
        id: 'complexity-linear',
        kind: 'text',
        prompt: 'Write the Big-O for scanning every array item once.',
        correctAnswer: 'O(n)',
        explanation: 'One bounded operation per item produces linear growth.',
        conceptIds: ['big-o'],
      },
    ],
  },
  {
    slug: 'bubble-sort-checkpoint',
    lessonSlug: 'bubble-sort-js',
    title: 'Bubble Sort Checkpoint',
    passingScore: 70,
    questions: [
      {
        id: 'bubble-action',
        kind: 'multiple-choice',
        prompt:
          'What does Bubble Sort do when the left adjacent value is larger?',
        options: [
          'Stops',
          'Swaps the pair',
          'Skips the pair',
          'Reverses the array',
        ],
        correctAnswer: 'Swaps the pair',
        explanation: 'The adjacent inversion is removed with a swap.',
        conceptIds: ['adjacent-comparison'],
      },
      {
        id: 'bubble-order',
        kind: 'ordering',
        prompt: 'Order the phases for an out-of-order pair.',
        options: ['Compare', 'Swap', 'Settle'],
        correctAnswer: ['Compare', 'Swap', 'Settle'],
        explanation:
          'The player evaluates, moves, then presents the stable result.',
        conceptIds: ['sorting-invariant'],
      },
    ],
  },
  {
    slug: 'two-pointers-checkpoint',
    lessonSlug: 'two-pointers-js',
    title: 'Two Pointers Checkpoint',
    passingScore: 70,
    questions: [
      {
        id: 'pointer-benefit',
        kind: 'multiple-choice',
        prompt: 'Why can two pointers replace some nested loops?',
        options: [
          'They preserve a movement invariant',
          'They sort automatically',
          'They use recursion',
          'They cache the array',
        ],
        correctAnswer: 'They preserve a movement invariant',
        explanation:
          'A valid invariant tells each pointer when and how to move.',
        conceptIds: ['pointer-invariant'],
      },
    ],
  },
  {
    slug: 'sliding-window-checkpoint',
    lessonSlug: 'sliding-window-ts',
    title: 'Sliding Window Checkpoint',
    passingScore: 70,
    questions: [
      {
        id: 'window-state',
        kind: 'multiple-choice',
        prompt: 'What makes a sliding window efficient?',
        options: [
          'It recomputes every subarray',
          'It updates state as boundaries move',
          'It sorts first',
          'It uses a queue',
        ],
        correctAnswer: 'It updates state as boundaries move',
        explanation: 'Incremental updates avoid recomputing each range.',
        conceptIds: ['incremental-state'],
      },
    ],
  },
  {
    slug: 'bfs-grid-checkpoint',
    lessonSlug: 'bfs-grid-go',
    title: 'BFS Grid Checkpoint',
    passingScore: 70,
    questions: [
      {
        id: 'bfs-frontier',
        kind: 'multiple-choice',
        prompt: 'Which data structure gives BFS its layer-by-layer order?',
        options: ['Stack', 'Queue', 'Heap', 'Hash map'],
        correctAnswer: 'Queue',
        explanation: 'FIFO processing expands the oldest frontier layer first.',
        conceptIds: ['queue-frontier'],
      },
    ],
  },
  {
    slug: 'dfs-grid-checkpoint',
    lessonSlug: 'dfs-grid-go',
    title: 'DFS Grid Checkpoint',
    passingScore: 70,
    questions: [
      {
        id: 'dfs-frontier',
        kind: 'multiple-choice',
        prompt:
          'Which frontier discipline makes DFS explore one branch deeply?',
        options: ['FIFO queue', 'LIFO stack', 'Priority queue', 'Sorted set'],
        correctAnswer: 'LIFO stack',
        explanation: 'The newest discovered node is processed first.',
        conceptIds: ['stack-frontier'],
      },
    ],
  },
];

function starterAssessment(input: {
  slug: string;
  lessonSlug: string;
  title: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  conceptId: string;
}): AssessmentDefinition {
  return {
    slug: input.slug,
    lessonSlug: input.lessonSlug,
    title: input.title,
    passingScore: 70,
    questions: [
      {
        id: `${input.slug}-question`,
        kind: 'multiple-choice',
        prompt: input.question,
        options: input.options,
        correctAnswer: input.answer,
        explanation: input.explanation,
        conceptIds: [input.conceptId],
      },
    ],
  };
}

export const assessments: AssessmentDefinition[] = [
  ...existingAssessments,
  starterAssessment({
    slug: 'software-systems-checkpoint',
    lessonSlug: 'software-systems-map',
    title: 'Software Systems Checkpoint',
    question: 'What best separates a system boundary?',
    options: [
      'A distinct responsibility and contract',
      'A different font',
      'A longer function',
      'A shared variable',
    ],
    answer: 'A distinct responsibility and contract',
    explanation:
      'Boundaries isolate responsibilities behind explicit contracts.',
    conceptId: 'system-boundaries',
  }),
  starterAssessment({
    slug: 'javascript-runtime-checkpoint',
    lessonSlug: 'javascript-execution-model',
    title: 'JavaScript Runtime Checkpoint',
    question: 'When can a queued callback enter the JavaScript call stack?',
    options: [
      'When the current stack is empty',
      'Before synchronous code',
      'Immediately after registration',
      'Only after a page reload',
    ],
    answer: 'When the current stack is empty',
    explanation:
      'The event loop schedules queued work after run-to-completion.',
    conceptId: 'event-loop',
  }),
  starterAssessment({
    slug: 'request-cdn-checkpoint',
    lessonSlug: 'request-to-cdn',
    title: 'Request to CDN Checkpoint',
    question: 'What happens on a CDN cache miss?',
    options: [
      'The edge fetches from the origin',
      'DNS stops',
      'TLS is disabled',
      'The client becomes the origin',
    ],
    answer: 'The edge fetches from the origin',
    explanation: 'The edge fills its cache from the configured origin.',
    conceptId: 'origin-fallback',
  }),
  starterAssessment({
    slug: 'relational-modeling-checkpoint',
    lessonSlug: 'relational-data-modeling',
    title: 'Relational Modeling Checkpoint',
    question: 'What does a foreign key protect?',
    options: [
      'Referential integrity',
      'CSS ordering',
      'Network latency',
      'File compression',
    ],
    answer: 'Referential integrity',
    explanation: 'A foreign key requires a referenced row to exist.',
    conceptId: 'foreign-key',
  }),
  starterAssessment({
    slug: 'containers-images-checkpoint',
    lessonSlug: 'containers-and-images',
    title: 'Containers and Images Checkpoint',
    question: 'Which artifact is the immutable build output?',
    options: ['Image', 'Running container', 'Process ID', 'Log stream'],
    answer: 'Image',
    explanation: 'A container starts as a runtime instance of an image.',
    conceptId: 'image-layer',
  }),
  starterAssessment({
    slug: 'vectors-ml-checkpoint',
    lessonSlug: 'vectors-for-machine-learning',
    title: 'Vectors for ML Checkpoint',
    question: 'What can a feature vector represent?',
    options: [
      'One example as numeric coordinates',
      'Only a database table',
      'A deployment region',
      'A network socket',
    ],
    answer: 'One example as numeric coordinates',
    explanation:
      'Features form coordinates that algorithms can transform and compare.',
    conceptId: 'vector-representation',
  }),
  starterAssessment({
    slug: 'agent-loop-checkpoint',
    lessonSlug: 'prompt-to-agent-loop',
    title: 'Agent Loop Checkpoint',
    question: 'Why must a tool result return to the agent loop?',
    options: [
      'It becomes evidence for the next decision',
      'It makes grading random',
      'It hides permissions',
      'It replaces the goal',
    ],
    answer: 'It becomes evidence for the next decision',
    explanation: 'Observations ground the next model decision and evaluation.',
    conceptId: 'tool-loop',
  }),
  starterAssessment({
    slug: 'technical-reading-checkpoint',
    lessonSlug: 'active-technical-reading',
    title: 'Technical Reading Checkpoint',
    question: 'Which action best tests understanding after reading?',
    options: [
      'Recall the model without looking',
      'Highlight every sentence',
      'Copy the chapter',
      'Read faster',
    ],
    answer: 'Recall the model without looking',
    explanation:
      'Retrieval exposes missing understanding and strengthens memory.',
    conceptId: 'active-recall',
  }),
];

export const lessonBySlug = new Map(
  lessons.map((lesson) => [lesson.slug, lesson]),
);
export const topicBySlug = new Map(topics.map((topic) => [topic.slug, topic]));
export const pathBySlug = new Map(
  learningPaths.map((item) => [item.slug, item]),
);
export const trackBySlug = new Map(tracks.map((track) => [track.slug, track]));
export const assessmentBySlug = new Map(
  assessments.map((assessment) => [assessment.slug, assessment]),
);

function duplicates(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) =>
    seen.has(value) ? true : (seen.add(value), false),
  );
}

function hasPathCycle(
  slug: string,
  visiting = new Set<string>(),
  visited = new Set<string>(),
): boolean {
  if (visiting.has(slug)) return true;
  if (visited.has(slug)) return false;
  visiting.add(slug);
  for (const prerequisite of pathBySlug.get(slug)?.prerequisitePathSlugs ??
    []) {
    if (hasPathCycle(prerequisite, visiting, visited)) return true;
  }
  visiting.delete(slug);
  visited.add(slug);
  return false;
}

export function validateCatalog() {
  const errors: string[] = [];
  for (const duplicate of duplicates(tracks.map((item) => item.slug)))
    errors.push(`duplicate track ${duplicate}`);
  for (const duplicate of duplicates(topics.map((item) => item.slug)))
    errors.push(`duplicate topic ${duplicate}`);
  for (const duplicate of duplicates(lessons.map((item) => item.slug)))
    errors.push(`duplicate lesson ${duplicate}`);
  for (const duplicate of duplicates(learningPaths.map((item) => item.slug)))
    errors.push(`duplicate path ${duplicate}`);
  for (const duplicate of duplicates(assessments.map((item) => item.slug)))
    errors.push(`duplicate assessment ${duplicate}`);
  for (const track of tracks) {
    for (const pathSlug of track.pathSlugs)
      if (!pathBySlug.has(pathSlug))
        errors.push(`${track.slug}: unknown path ${pathSlug}`);
  }
  for (const lesson of lessons) {
    if (!topicBySlug.has(lesson.topicSlug))
      errors.push(`${lesson.slug}: unknown topic ${lesson.topicSlug}`);
    if (!assessmentBySlug.has(lesson.assessmentSlug))
      errors.push(
        `${lesson.slug}: unknown assessment ${lesson.assessmentSlug}`,
      );
    if (lesson.visualization === 'concept-flow' && !lesson.conceptFlow)
      errors.push(`${lesson.slug}: missing concept flow`);
    for (const prerequisite of lesson.prerequisites)
      if (!lessonBySlug.has(prerequisite))
        errors.push(`${lesson.slug}: unknown prerequisite ${prerequisite}`);
  }
  for (const item of learningPaths) {
    if (!trackBySlug.has(item.trackSlug))
      errors.push(`${item.slug}: unknown track ${item.trackSlug}`);
    for (const prerequisite of item.prerequisitePathSlugs)
      if (!pathBySlug.has(prerequisite))
        errors.push(`${item.slug}: unknown prerequisite path ${prerequisite}`);
    for (const pathModule of item.modules)
      if (
        pathModule.status === 'available' &&
        !lessonBySlug.has(pathModule.lessonSlug)
      )
        errors.push(`${item.slug}: unknown lesson ${pathModule.lessonSlug}`);
      else if (
        pathModule.status === 'practice' &&
        !pathModule.href.startsWith('/simulations/')
      )
        errors.push(`${item.slug}: invalid practice link ${pathModule.href}`);
    if (hasPathCycle(item.slug))
      errors.push(`${item.slug}: cyclic path prerequisite`);
  }
  for (const assessment of assessments)
    if (!lessonBySlug.has(assessment.lessonSlug))
      errors.push(
        `${assessment.slug}: unknown lesson ${assessment.lessonSlug}`,
      );
  return Array.from(new Set(errors));
}

export function availableLessonSlugs(pathDefinition: LearningPathDefinition) {
  return pathDefinition.modules
    .filter(
      (
        pathModule,
      ): pathModule is Extract<PathModuleDefinition, { status: 'available' }> =>
        pathModule.status === 'available',
    )
    .map((pathModule) => pathModule.lessonSlug);
}

export function isCurriculumDomain(value: string): value is CurriculumDomain {
  return tracks.some((track) => track.slug === value);
}
