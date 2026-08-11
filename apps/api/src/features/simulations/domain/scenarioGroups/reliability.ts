import type { SystemDesignScenario } from '@algoflow/contracts';
import { edge, flow, node, rule } from './builders';

export const reliabilityScenarios: SystemDesignScenario[] = [
  {
    slug: 'overload-protection',
    version: 1,
    category: 'reliability',
    topics: ['load-shedding', 'backpressure', 'caching', 'observability'],
    estimatedMinutes: 55,
    title: 'Protect a Service from Overload',
    summary:
      'Keep critical work available when traffic exceeds safe downstream capacity.',
    difficulty: 'intermediate',
    goal: 'Introduce capacity boundaries, buffering, and signals that prevent cascading failure.',
    traffic: [
      'Normal 4K requests/second',
      'Burst 25K requests/second',
      'Database limit 6K queries/second',
    ],
    requirements: [
      'Traffic distribution',
      'Bounded buffering',
      'Critical-path protection',
      'Saturation signals',
    ],
    constraints: [
      'Queues cannot grow forever',
      'Retries consume capacity',
      'Explain rejected work',
    ],
    initialGraph: {
      nodes: [
        node('client', 'client', 'Clients', 70, 200),
        node('service', 'service', 'Application', 480, 200),
        node('database', 'relational-database', 'Database', 790, 200, {
          durable: true,
        }),
      ],
      edges: [
        edge('client-service', 'client', 'service'),
        edge('service-database', 'service', 'database'),
      ],
    },
    flows: [
      flow(
        'protected-request',
        'Protected request',
        'request',
        ['client', 'load-balancer', 'service', 'cache', 'relational-database'],
        [
          'Traffic reaches the public capacity boundary.',
          'The load balancer only routes to healthy capacity.',
          'The service applies budgets and load shedding.',
          'A cache absorbs safe repeat reads.',
          'The database handles bounded authoritative work.',
        ],
      ),
      flow(
        'deferred-work',
        'Deferred work',
        'async-job',
        ['service', 'queue', 'worker'],
        [
          'The service accepts deferrable intent.',
          'A bounded queue applies backpressure.',
          'Workers consume at safe downstream capacity.',
        ],
      ),
    ],
    rubric: [
      rule({
        id: 'overload-lb',
        conceptId: 'healthy-capacity-routing',
        title: 'Load distribution',
        category: 'availability',
        check: { kind: 'node-present', nodeType: 'load-balancer' },
        success: 'Traffic is distributed only to healthy service capacity.',
        failure: 'Add a load balancer before the service.',
      }),
      rule({
        id: 'overload-replicas',
        conceptId: 'bounded-service-capacity',
        title: 'Service capacity declared',
        category: 'scalability',
        check: {
          kind: 'config-equals',
          nodeType: 'service',
          key: 'replicas',
          value: 3,
        },
        success: 'The exercise has three declared service replicas.',
        failure: 'Configure the service with exactly three replicas.',
      }),
      rule({
        id: 'overload-queue',
        conceptId: 'bounded-work-buffer',
        title: 'Deferred-work buffer',
        category: 'availability',
        check: { kind: 'node-present', nodeType: 'queue' },
        success: 'Deferrable work has an explicit buffer.',
        failure: 'Add a queue for work that can leave the request path.',
      }),
      rule({
        id: 'overload-signals',
        conceptId: 'saturation-observability',
        title: 'Saturation visibility',
        category: 'availability',
        check: { kind: 'node-present', nodeType: 'observability' },
        success:
          'Load, queue depth, rejection, and dependency saturation can be observed.',
        failure: 'Add observability for saturation and rejected work.',
      }),
      rule({
        id: 'overload-tradeoff',
        conceptId: 'load-shedding-tradeoff',
        title: 'Overload policy explained',
        category: 'trade-offs',
        check: { kind: 'explanation-length', minLength: 70 },
        success:
          'The design explains budgets, retries, queue bounds, and rejected work.',
        failure:
          'Explain which work is rejected, deferred, cached, or retried under overload.',
      }),
    ],
  },
  {
    slug: 'disaster-recovery',
    version: 1,
    category: 'reliability',
    topics: ['backup', 'restore', 'rto', 'rpo'],
    estimatedMinutes: 60,
    title: 'Disaster Recovery Architecture',
    summary:
      'Design recovery around explicit data-loss and restoration objectives.',
    difficulty: 'advanced',
    goal: 'Recover service and data after a regional loss with measurable RTO and RPO.',
    traffic: ['1K writes/second', 'RTO 30 minutes', 'RPO 5 minutes'],
    requirements: [
      'Independent backup',
      'Recovery database',
      'Warm service capacity',
      'Recovery telemetry',
    ],
    constraints: [
      'A backup is useful only if restorable',
      'Primary region is unavailable',
      'Explain recovery cost',
    ],
    initialGraph: {
      nodes: [
        node('service', 'service', 'Primary service', 210, 180),
        node('database', 'relational-database', 'Primary database', 500, 180, {
          durable: true,
        }),
        node('observability', 'observability', 'Recovery signals', 800, 400),
      ],
      edges: [edge('service-database', 'service', 'database')],
    },
    flows: [
      flow(
        'backup',
        'Protected data copy',
        'replication',
        ['relational-database', 'backup'],
        [
          'The primary commits durable state.',
          'An independent backup boundary preserves a recoverable copy.',
        ],
      ),
      flow(
        'restore',
        'Regional recovery',
        'recovery',
        ['backup', 'database-replica', 'service', 'observability'],
        [
          'A verified backup starts restoration.',
          'A recovery database becomes available.',
          'Warm service capacity reconnects to restored data.',
          'Recovery signals confirm correctness and objectives.',
        ],
      ),
    ],
    rubric: [
      rule({
        id: 'dr-backup',
        conceptId: 'independent-recovery-copy',
        title: 'Independent backup',
        category: 'durability',
        check: { kind: 'node-present', nodeType: 'backup' },
        success: 'An explicit backup boundary survives primary loss.',
        failure: 'Add an independent backup boundary.',
      }),
      rule({
        id: 'dr-replica',
        conceptId: 'recovery-database',
        title: 'Recovery database',
        category: 'availability',
        check: { kind: 'node-present', nodeType: 'database-replica' },
        success:
          'A recovery database can receive restored or replicated state.',
        failure: 'Add a database replica for recovery.',
      }),
      rule({
        id: 'dr-path',
        conceptId: 'restore-service-path',
        title: 'Complete recovery path',
        category: 'availability',
        check: { kind: 'path-exists', fromType: 'backup', toType: 'service' },
        success: 'Restored data reaches recoverable service capacity.',
        failure: 'Connect backup, recovery database, and service.',
      }),
      rule({
        id: 'dr-multiregion',
        conceptId: 'regional-recovery-capacity',
        title: 'Recovery capacity declared',
        category: 'availability',
        check: {
          kind: 'config-equals',
          nodeType: 'service',
          key: 'multiRegion',
          value: true,
        },
        success:
          'Service capacity is explicitly available beyond the failed region.',
        failure: 'Enable multi region on the service.',
      }),
      rule({
        id: 'dr-tradeoff',
        conceptId: 'rto-rpo-cost-tradeoff',
        title: 'Recovery objectives explained',
        category: 'trade-offs',
        check: { kind: 'explanation-length', minLength: 70 },
        success:
          'The design connects backup frequency, restore testing, RTO, RPO, and cost.',
        failure:
          'Explain how backup frequency and warm capacity meet RTO and RPO.',
      }),
    ],
  },
  {
    slug: 'queue-backlog-recovery',
    version: 1,
    category: 'reliability',
    topics: ['queues', 'backlog', 'dead-letter-queue', 'recovery'],
    estimatedMinutes: 55,
    title: 'Recover a Queue Backlog',
    summary:
      'Drain delayed work without overwhelming the dependency that caused the incident.',
    difficulty: 'intermediate',
    goal: 'Restore worker throughput, isolate poison jobs, and drain backlog inside a safe capacity envelope.',
    traffic: [
      'Normal 2K jobs/minute',
      'Backlog 1.2M jobs',
      'Dependency limit 5K calls/minute',
    ],
    requirements: [
      'Durable jobs',
      'Horizontal workers',
      'Poison-job isolation',
      'Backlog and age signals',
    ],
    constraints: [
      'Do not replay side effects twice',
      'Dependency has a hard rate limit',
      'Explain drain time',
    ],
    initialGraph: {
      nodes: [
        node('gateway', 'api-gateway', 'Job API', 80, 200),
        node('queue', 'queue', 'Job queue', 330, 200, { durable: true }),
        node('worker', 'worker', 'Workers', 600, 200),
        node('database', 'relational-database', 'Job results', 850, 200, {
          durable: true,
        }),
      ],
      edges: [
        edge('gateway-queue', 'gateway', 'queue'),
        edge('queue-worker', 'queue', 'worker'),
        edge('worker-database', 'worker', 'database'),
      ],
    },
    flows: [
      flow(
        'job-recovery',
        'Backlog recovery',
        'recovery',
        ['queue', 'worker', 'relational-database'],
        [
          'The queue retains delayed jobs.',
          'Workers drain at a dependency-safe rate.',
          'Idempotent results are committed durably.',
        ],
      ),
      flow(
        'poison-job',
        'Poison job isolation',
        'failure',
        ['queue', 'worker', 'dead-letter-queue', 'observability'],
        [
          'The queue redelivers a failing job.',
          'The worker exhausts bounded retries.',
          'The job moves to an inspectable dead-letter queue.',
          'Telemetry exposes failure and backlog age.',
        ],
      ),
    ],
    rubric: [
      rule({
        id: 'backlog-durable',
        conceptId: 'durable-backlog',
        title: 'Durable queue',
        category: 'durability',
        check: {
          kind: 'config-equals',
          nodeType: 'queue',
          key: 'durable',
          value: true,
        },
        success: 'The backlog survives worker and process failure.',
        failure: 'Enable durable on the queue.',
      }),
      rule({
        id: 'backlog-workers',
        conceptId: 'controlled-worker-scale',
        title: 'Worker capacity',
        category: 'scalability',
        check: {
          kind: 'config-equals',
          nodeType: 'worker',
          key: 'replicas',
          value: 3,
        },
        success: 'Three exercise workers provide controlled drain capacity.',
        failure: 'Configure exactly three worker replicas.',
      }),
      rule({
        id: 'backlog-idempotent',
        conceptId: 'safe-job-replay',
        title: 'Idempotent workers',
        category: 'requirements',
        check: {
          kind: 'config-equals',
          nodeType: 'worker',
          key: 'idempotent',
          value: true,
        },
        success: 'Job replay cannot duplicate the business side effect.',
        failure: 'Enable idempotent on workers.',
      }),
      rule({
        id: 'backlog-dlq',
        conceptId: 'poison-job-boundary',
        title: 'Dead-letter queue',
        category: 'availability',
        check: { kind: 'node-present', nodeType: 'dead-letter-queue' },
        success: 'Poison jobs leave the hot recovery path.',
        failure: 'Add a dead-letter queue.',
      }),
      rule({
        id: 'backlog-tradeoff',
        conceptId: 'backlog-drain-budget',
        title: 'Drain plan explained',
        category: 'trade-offs',
        check: { kind: 'explanation-length', minLength: 70 },
        success:
          'The design explains rate limits, retry budgets, drain time, and idempotency.',
        failure:
          'Explain safe worker concurrency, dependency limits, retries, and expected drain time.',
      }),
    ],
  },
];
