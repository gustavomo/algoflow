import type { SystemDesignScenario, SystemNodeType } from '@algoflow/contracts';

const node = (
  id: string,
  type: SystemNodeType,
  label: string,
  x: number,
  y: number,
) => ({ id, type, label, x, y, config: {} });
const edge = (id: string, from: string, to: string, label?: string) => ({
  id,
  from,
  to,
  label,
});

export const systemDesignScenarios: SystemDesignScenario[] = [
  {
    slug: 'global-cdn-delivery',
    version: 1,
    title: 'Global Static Delivery',
    summary:
      'Deliver versioned assets globally with low latency and a controlled origin.',
    difficulty: 'foundation',
    goal: 'Serve static application assets near users while protecting and observing the origin path.',
    traffic: [
      '2M requests/day',
      '90% cacheable assets',
      'Users in three continents',
    ],
    requirements: [
      'Low edge latency',
      'TLS at the delivery boundary',
      'Origin fallback',
      'Observable cache behavior',
    ],
    constraints: [
      'One primary object store',
      'Prefer simple managed boundaries',
      'Explain invalidation and cost',
    ],
    initialGraph: {
      nodes: [
        node('client-1', 'client', 'Global clients', 80, 220),
        node('dns-1', 'dns', 'DNS', 280, 220),
        node('origin-1', 'object-storage', 'Asset origin', 720, 220),
        node('obs-1', 'observability', 'Telemetry', 720, 420),
      ],
      edges: [
        edge('client-dns', 'client-1', 'dns-1', 'resolve'),
        edge('dns-origin', 'dns-1', 'origin-1', 'fetch'),
      ],
    },
    flows: [
      {
        id: 'asset-request',
        title: 'Asset request',
        kind: 'cache',
        nodeTypes: ['client', 'dns', 'cdn', 'object-storage'],
        narration: [
          'The browser requests a versioned asset.',
          'DNS resolves the delivery hostname.',
          'The edge serves a hit or fetches on miss.',
          'The origin returns the canonical object.',
        ],
      },
    ],
    rubric: [
      {
        id: 'cdn-node',
        conceptId: 'edge-cache-boundary',
        title: 'Edge cache exists',
        category: 'latency',
        weight: 20,
        check: { kind: 'node-present', nodeType: 'cdn' },
        success: 'A CDN edge is present near users.',
        failure: 'Add a CDN between DNS and the origin.',
        reviewPrompt: 'Why place a CDN between DNS and an object origin?',
        reviewAnswer:
          'It serves cacheable bytes near users and shields the origin from repeat traffic.',
      },
      {
        id: 'dns-cdn',
        conceptId: 'dns-edge-routing',
        title: 'DNS routes to edge',
        category: 'requirements',
        weight: 20,
        check: { kind: 'edge-present', fromType: 'dns', toType: 'cdn' },
        success: 'DNS directs traffic to the edge.',
        failure: 'Connect DNS to the CDN.',
        reviewPrompt: 'What should DNS resolve for edge delivery?',
        reviewAnswer:
          'The delivery hostname should resolve toward the CDN rather than bypassing it.',
      },
      {
        id: 'cdn-origin',
        conceptId: 'origin-fallback-path',
        title: 'Edge can reach origin',
        category: 'availability',
        weight: 20,
        check: {
          kind: 'path-exists',
          fromType: 'cdn',
          toType: 'object-storage',
        },
        success: 'A cache miss has an origin path.',
        failure: 'Connect the CDN to object storage.',
        reviewPrompt: 'What path handles a CDN cache miss?',
        reviewAnswer:
          'The edge fetches the canonical object from the configured origin.',
      },
      {
        id: 'cdn-tls',
        conceptId: 'edge-tls',
        title: 'TLS is configured',
        category: 'security',
        weight: 20,
        check: { kind: 'config-truthy', nodeType: 'cdn', key: 'tls' },
        success: 'The delivery edge terminates TLS.',
        failure: 'Select the CDN and enable TLS.',
        reviewPrompt: 'Where should TLS be enforced for CDN delivery?',
        reviewAnswer:
          'At the public edge, with protected transport to the origin as required.',
      },
      {
        id: 'cdn-tradeoffs',
        conceptId: 'cache-invalidation-tradeoff',
        title: 'Invalidation trade-off explained',
        category: 'trade-offs',
        weight: 20,
        check: { kind: 'explanation-length', minLength: 40 },
        success: 'The design records an explicit trade-off.',
        failure:
          'Explain cache invalidation, latency, or cost in at least 40 characters.',
        reviewPrompt: 'What trade-off must a CDN design explain?',
        reviewAnswer:
          'Cache freshness and invalidation must be balanced against latency, origin load, and cost.',
      },
    ],
  },
  {
    slug: 'url-shortener',
    version: 1,
    title: 'Scalable URL Shortener',
    summary:
      'Design a redirect service with fast reads and durable unique mappings.',
    difficulty: 'intermediate',
    goal: 'Create and resolve short URLs under read-heavy traffic without losing mappings.',
    traffic: ['10K writes/day', '8M redirects/day', 'p95 redirect under 100ms'],
    requirements: [
      'Unique short keys',
      'Fast redirect reads',
      'Durable mappings',
      'Horizontal service scale',
    ],
    constraints: [
      'Strong uniqueness on create',
      'Eventual analytics allowed',
      'Explain hot-key behavior',
    ],
    initialGraph: {
      nodes: [
        node('client-1', 'client', 'Clients', 70, 220),
        node('gateway-1', 'api-gateway', 'API gateway', 290, 220),
        node('service-1', 'service', 'Redirect service', 520, 220),
        node('db-1', 'relational-database', 'URL database', 760, 220),
      ],
      edges: [
        edge('client-gateway', 'client-1', 'gateway-1'),
        edge('gateway-service', 'gateway-1', 'service-1'),
        edge('service-db', 'service-1', 'db-1'),
      ],
    },
    flows: [
      {
        id: 'redirect-read',
        title: 'Redirect read',
        kind: 'request',
        nodeTypes: [
          'client',
          'api-gateway',
          'service',
          'cache',
          'relational-database',
        ],
        narration: [
          'A client resolves a short code.',
          'The gateway validates and routes.',
          'The service applies redirect logic.',
          'The cache serves popular mappings.',
          'The database remains durable authority.',
        ],
      },
    ],
    rubric: [
      {
        id: 'url-db',
        conceptId: 'durable-url-mapping',
        title: 'Durable mapping store',
        category: 'durability',
        weight: 20,
        check: { kind: 'node-present', nodeType: 'relational-database' },
        success: 'Mappings have a durable relational authority.',
        failure: 'Add a relational database for mappings.',
        reviewPrompt: 'Why does a URL shortener need durable mapping storage?',
        reviewAnswer:
          'A short code must continue resolving to the same destination after process or cache loss.',
      },
      {
        id: 'url-cache',
        conceptId: 'redirect-read-cache',
        title: 'Read cache',
        category: 'latency',
        weight: 20,
        check: { kind: 'node-present', nodeType: 'cache' },
        success: 'Popular redirects can avoid database reads.',
        failure: 'Add a cache for hot mappings.',
        reviewPrompt: 'What does a URL cache optimize?',
        reviewAnswer:
          'It reduces latency and database load for frequently resolved short codes.',
      },
      {
        id: 'url-lb',
        conceptId: 'horizontal-service-scale',
        title: 'Load distribution',
        category: 'scalability',
        weight: 20,
        check: { kind: 'node-present', nodeType: 'load-balancer' },
        success: 'Traffic can be distributed across service instances.',
        failure: 'Add a load balancer before the service tier.',
        reviewPrompt:
          'Why add a load balancer before stateless redirect services?',
        reviewAnswer:
          'It distributes requests and removes a single service instance as the traffic bottleneck.',
      },
      {
        id: 'url-replicas',
        conceptId: 'service-replica-capacity',
        title: 'Service replicas configured',
        category: 'availability',
        weight: 20,
        check: { kind: 'config-truthy', nodeType: 'service', key: 'replicas' },
        success: 'The service declares horizontal capacity.',
        failure: 'Configure replicas on the redirect service.',
        reviewPrompt: 'What does more than one service replica improve?',
        reviewAnswer:
          'It adds capacity and lets traffic continue when one instance fails.',
      },
      {
        id: 'url-tradeoffs',
        conceptId: 'url-key-tradeoff',
        title: 'Key and hot-cache trade-off',
        category: 'trade-offs',
        weight: 20,
        check: { kind: 'explanation-length', minLength: 40 },
        success: 'The key or hot-cache trade-off is explicit.',
        failure: 'Explain uniqueness, hot keys, consistency, or cost.',
        reviewPrompt: 'Which URL-shortener trade-off should be explicit?',
        reviewAnswer:
          'Key generation consistency and hot-key caching affect latency, correctness, and operational cost.',
      },
    ],
  },
  {
    slug: 'async-file-processing',
    version: 1,
    title: 'Asynchronous File Processing',
    summary:
      'Accept uploads quickly and process durable jobs outside the request path.',
    difficulty: 'intermediate',
    goal: 'Store uploaded files durably, queue work, and process it with observable retry behavior.',
    traffic: [
      '50K uploads/day',
      'Files up to 250MB',
      'Processing may take 10 minutes',
    ],
    requirements: [
      'Fast upload acknowledgement',
      'Durable file storage',
      'Retryable background jobs',
      'Observable failures',
    ],
    constraints: [
      'No long HTTP processing',
      'At-least-once jobs',
      'Explain idempotency',
    ],
    initialGraph: {
      nodes: [
        node('client-1', 'client', 'Uploader', 70, 220),
        node('gateway-1', 'api-gateway', 'Upload API', 330, 220),
        node('storage-1', 'object-storage', 'File storage', 760, 220),
      ],
      edges: [
        edge('client-gateway', 'client-1', 'gateway-1'),
        edge('gateway-storage', 'gateway-1', 'storage-1', 'upload'),
      ],
    },
    flows: [
      {
        id: 'processing-job',
        title: 'Processing job',
        kind: 'async-job',
        nodeTypes: ['api-gateway', 'queue', 'worker', 'object-storage'],
        narration: [
          'The API acknowledges durable intent.',
          'A queue buffers and retries work.',
          'A worker processes one idempotent job.',
          'Results and source files remain in object storage.',
        ],
      },
    ],
    rubric: [
      {
        id: 'file-storage',
        conceptId: 'durable-upload-storage',
        title: 'Durable file storage',
        category: 'durability',
        weight: 20,
        check: { kind: 'node-present', nodeType: 'object-storage' },
        success: 'Files live outside transient workers.',
        failure: 'Add object storage for uploaded files.',
        reviewPrompt: 'Why store uploaded files before background processing?',
        reviewAnswer:
          'Durable storage lets jobs retry without depending on the original HTTP connection.',
      },
      {
        id: 'file-queue',
        conceptId: 'durable-job-queue',
        title: 'Queue decouples work',
        category: 'scalability',
        weight: 20,
        check: { kind: 'node-present', nodeType: 'queue' },
        success: 'A queue separates request and processing capacity.',
        failure: 'Add a queue after upload acceptance.',
        reviewPrompt: 'Why put a queue before file workers?',
        reviewAnswer:
          'It buffers bursts, enables retries, and decouples request latency from processing time.',
      },
      {
        id: 'file-worker',
        conceptId: 'background-worker',
        title: 'Background worker',
        category: 'requirements',
        weight: 20,
        check: { kind: 'node-present', nodeType: 'worker' },
        success: 'Long work runs outside the HTTP request.',
        failure: 'Add a worker that consumes queued jobs.',
        reviewPrompt: 'Where should long file processing execute?',
        reviewAnswer:
          'A background worker should consume a durable job outside the request path.',
      },
      {
        id: 'file-path',
        conceptId: 'async-job-path',
        title: 'Queue reaches worker and storage',
        category: 'availability',
        weight: 20,
        check: {
          kind: 'path-exists',
          fromType: 'queue',
          toType: 'object-storage',
        },
        success: 'Queued work has a complete processing path.',
        failure: 'Connect queue to worker and worker to object storage.',
        reviewPrompt: 'What complete path must an async file job have?',
        reviewAnswer:
          'The queue dispatches to a worker that can read and write durable object storage.',
      },
      {
        id: 'file-tradeoffs',
        conceptId: 'idempotent-job-tradeoff',
        title: 'Idempotency trade-off explained',
        category: 'trade-offs',
        weight: 20,
        check: { kind: 'explanation-length', minLength: 40 },
        success: 'Retry and idempotency are addressed.',
        failure: 'Explain duplicate delivery, idempotency, retry, or cost.',
        reviewPrompt: 'Why must an at-least-once file worker be idempotent?',
        reviewAnswer:
          'The same job may be delivered more than once, so repeated processing must not corrupt or duplicate results.',
      },
    ],
  },
];

export const scenarioBySlug = new Map(
  systemDesignScenarios.map((scenario) => [scenario.slug, scenario]),
);
