import type { SystemDesignScenario } from '@algoflow/contracts';
import { edge, flow, node, rule } from './builders';

export const databaseScenarios: SystemDesignScenario[] = [
  {
    slug: 'online-database-migration',
    version: 1,
    category: 'database',
    topics: [
      'online-migration',
      'change-data-capture',
      'validation',
      'rollback',
    ],
    estimatedMinutes: 65,
    title: 'Online Database Migration',
    summary:
      'Move live relational data with continuous replication and evidence-based cutover.',
    difficulty: 'advanced',
    goal: 'Migrate a live database without planned downtime or silent data loss.',
    traffic: [
      '12K writes/second',
      '6 TB source database',
      'Lag target under 5 seconds',
    ],
    requirements: [
      'Continuous copy',
      'Row-level validation',
      'Cutover control',
      'Recoverable source',
    ],
    constraints: [
      'Source serves writes during copy',
      'Schema changes are additive first',
      'No unverified cutover',
    ],
    initialGraph: {
      nodes: [
        node('service', 'service', 'Application', 90, 180),
        node('source', 'relational-database', 'Source database', 330, 180, {
          durable: true,
        }),
        node(
          'destination',
          'database-replica',
          'Destination database',
          690,
          180,
        ),
        node('observability', 'observability', 'Reconciliation', 690, 410),
      ],
      edges: [edge('service-source', 'service', 'source')],
    },
    flows: [
      flow(
        'replicate',
        'Continuous replication',
        'replication',
        ['relational-database', 'change-data-capture', 'database-replica'],
        [
          'The source commits production writes.',
          'Change data capture emits committed mutations.',
          'The destination applies them in order.',
        ],
      ),
      flow(
        'validate',
        'Reconcile destination',
        'validation',
        ['change-data-capture', 'database-replica', 'observability'],
        [
          'The replication stream exposes progress.',
          'The destination serves validation reads.',
          'Reconciliation compares counts, checksums, and samples.',
        ],
      ),
      flow(
        'cutover',
        'Application cutover',
        'cutover',
        ['service', 'proxy', 'database-replica'],
        [
          'The application uses one data access boundary.',
          'A proxy changes the active database endpoint.',
          'The destination accepts production authority.',
        ],
      ),
      flow(
        'rollback',
        'Database rollback',
        'rollback',
        ['service', 'proxy', 'relational-database'],
        [
          'The application keeps its stable endpoint.',
          'The proxy restores the source target.',
          'The source resumes authority inside the rollback window.',
        ],
      ),
    ],
    rubric: [
      rule({
        id: 'db-migration-cdc',
        conceptId: 'continuous-database-copy',
        title: 'Continuous copy path',
        category: 'durability',
        check: {
          kind: 'path-exists',
          fromType: 'relational-database',
          toType: 'database-replica',
        },
        success: 'Source changes have a continuous path to the destination.',
        failure: 'Connect source, change data capture, and destination.',
      }),
      rule({
        id: 'db-migration-validation',
        conceptId: 'migration-reconciliation',
        title: 'Validation boundary',
        category: 'migration-safety',
        check: { kind: 'node-present', nodeType: 'observability' },
        success: 'The migration includes explicit reconciliation evidence.',
        failure: 'Add an observability or reconciliation boundary.',
      }),
      rule({
        id: 'db-migration-proxy',
        conceptId: 'database-cutover-seam',
        title: 'Database cutover seam',
        category: 'migration-safety',
        check: { kind: 'node-present', nodeType: 'proxy' },
        success:
          'A stable proxy can change database authority without an application rebuild.',
        failure: 'Add a database proxy for cutover and rollback.',
      }),
      rule({
        id: 'db-migration-rollback',
        conceptId: 'database-rollback-readiness',
        title: 'Rollback-ready cutover',
        category: 'migration-safety',
        check: {
          kind: 'config-equals',
          nodeType: 'proxy',
          key: 'rollbackReady',
          value: true,
        },
        success: 'The proxy declares a tested rollback path.',
        failure: 'Enable rollback ready on the proxy.',
      }),
      rule({
        id: 'db-migration-tradeoff',
        conceptId: 'database-authority-window',
        title: 'Authority window explained',
        category: 'trade-offs',
        check: { kind: 'explanation-length', minLength: 80 },
        success:
          'The design explains lag, validation, write authority, and rollback expiration.',
        failure:
          'Explain replication lag, validation thresholds, write authority, and rollback window.',
      }),
    ],
  },
  {
    slug: 'read-scaling',
    version: 1,
    category: 'database',
    topics: ['read-replicas', 'cache', 'replication-lag', 'query-routing'],
    estimatedMinutes: 55,
    title: 'Scale a Read-Heavy Database',
    summary:
      'Combine caches and replicas without pretending every read has the same consistency need.',
    difficulty: 'intermediate',
    goal: 'Reduce primary database load while preserving correct read-after-write behavior.',
    traffic: ['95% reads', '18K queries/second', 'p95 under 120ms'],
    requirements: [
      'Read distribution',
      'Hot-query caching',
      'Primary durability',
      'Lag visibility',
    ],
    constraints: [
      'Some reads require fresh data',
      'Replica lag occurs',
      'Explain invalidation',
    ],
    initialGraph: {
      nodes: [
        node('client', 'client', 'Clients', 70, 200),
        node('service', 'service', 'Query service', 330, 200),
        node('primary', 'relational-database', 'Primary database', 700, 200, {
          durable: true,
        }),
      ],
      edges: [
        edge('client-service', 'client', 'service'),
        edge('service-primary', 'service', 'primary'),
      ],
    },
    flows: [
      flow(
        'cached-read',
        'Cached read',
        'cache',
        ['client', 'service', 'cache', 'database-replica'],
        [
          'A client requests data.',
          'The service classifies consistency needs.',
          'The cache handles hot safe reads.',
          'A replica handles cache misses that tolerate lag.',
        ],
      ),
      flow(
        'fresh-read',
        'Fresh read',
        'request',
        ['client', 'service', 'relational-database'],
        [
          'A client requests freshly written state.',
          'The service selects the authoritative path.',
          'The primary database serves the consistent read.',
        ],
      ),
    ],
    rubric: [
      rule({
        id: 'read-replica',
        conceptId: 'read-replica-capacity',
        title: 'Read replica',
        category: 'scalability',
        check: { kind: 'node-present', nodeType: 'database-replica' },
        success: 'Lag-tolerant reads can leave the primary.',
        failure: 'Add a database replica.',
      }),
      rule({
        id: 'read-cache',
        conceptId: 'hot-read-cache',
        title: 'Hot-read cache',
        category: 'latency',
        check: { kind: 'node-present', nodeType: 'cache' },
        success: 'A cache can absorb repeat safe reads.',
        failure: 'Add a cache in the read path.',
      }),
      rule({
        id: 'read-primary-path',
        conceptId: 'fresh-read-authority',
        title: 'Fresh-read path',
        category: 'requirements',
        check: {
          kind: 'path-exists',
          fromType: 'service',
          toType: 'relational-database',
        },
        success: 'The service retains an authoritative read path.',
        failure: 'Keep a service path to the primary database.',
      }),
      rule({
        id: 'read-replication',
        conceptId: 'replica-lag-awareness',
        title: 'Replication enabled',
        category: 'availability',
        check: {
          kind: 'config-equals',
          nodeType: 'database-replica',
          key: 'replication',
          value: true,
        },
        success: 'The replica declares continuous replication.',
        failure: 'Enable replication on the database replica.',
      }),
      rule({
        id: 'read-tradeoff',
        conceptId: 'read-consistency-tradeoff',
        title: 'Read consistency explained',
        category: 'trade-offs',
        check: { kind: 'explanation-length', minLength: 60 },
        success:
          'The design explains lag, invalidation, and read-after-write routing.',
        failure:
          'Explain which reads can be stale and how cache invalidation works.',
      }),
    ],
  },
  {
    slug: 'tenant-sharding',
    version: 1,
    category: 'database',
    topics: ['sharding', 'tenant-routing', 'rebalancing', 'hot-shards'],
    estimatedMinutes: 65,
    title: 'Shard a Multi-Tenant Database',
    summary:
      'Introduce tenant-based partitions with explicit routing and rebalancing trade-offs.',
    difficulty: 'advanced',
    goal: 'Distribute tenant writes across database shards while preserving deterministic routing.',
    traffic: [
      '30K writes/second',
      '100K tenants',
      'Largest tenant is 8% of traffic',
    ],
    requirements: [
      'Deterministic shard routing',
      'At least two shards',
      'Hot-tenant visibility',
      'Rebalancing plan',
    ],
    constraints: [
      'Cross-shard joins are expensive',
      'Tenant moves must be online',
      'No random dual writes',
    ],
    initialGraph: {
      nodes: [
        node('client', 'client', 'Tenant clients', 70, 190),
        node('service', 'service', 'Tenant service', 330, 190),
        node('shard-a', 'relational-database', 'Shard A', 760, 110, {
          durable: true,
        }),
      ],
      edges: [edge('client-service', 'client', 'service')],
    },
    flows: [
      flow(
        'tenant-write',
        'Tenant-routed write',
        'write',
        ['client', 'service', 'proxy', 'relational-database'],
        [
          'A request carries tenant identity.',
          'The service validates the operation.',
          'A routing layer maps the tenant to one shard.',
          'The selected shard commits the write.',
        ],
      ),
    ],
    rubric: [
      rule({
        id: 'shard-count',
        conceptId: 'horizontal-database-partitions',
        title: 'Multiple shards',
        category: 'scalability',
        check: {
          kind: 'node-count',
          nodeType: 'relational-database',
          minCount: 2,
        },
        success: 'At least two relational shards distribute data.',
        failure: 'Add a second relational database shard.',
      }),
      rule({
        id: 'shard-router',
        conceptId: 'deterministic-shard-router',
        title: 'Shard routing boundary',
        category: 'requirements',
        check: { kind: 'node-present', nodeType: 'proxy' },
        success: 'A dedicated routing boundary owns tenant-to-shard mapping.',
        failure: 'Add a proxy or routing boundary before the shards.',
      }),
      rule({
        id: 'shard-path',
        conceptId: 'tenant-shard-path',
        title: 'Routed write path',
        category: 'requirements',
        check: {
          kind: 'path-exists',
          fromType: 'service',
          toType: 'relational-database',
        },
        success: 'Tenant writes reach a shard through the design.',
        failure: 'Connect the service through the router to a shard.',
      }),
      rule({
        id: 'shard-observability',
        conceptId: 'hot-shard-signals',
        title: 'Hot-shard visibility',
        category: 'availability',
        check: { kind: 'node-present', nodeType: 'observability' },
        success: 'Shard load and tenant skew are observable.',
        failure: 'Add observability for per-shard and per-tenant load.',
      }),
      rule({
        id: 'shard-tradeoff',
        conceptId: 'shard-rebalancing-tradeoff',
        title: 'Rebalancing explained',
        category: 'trade-offs',
        check: { kind: 'explanation-length', minLength: 70 },
        success:
          'The design explains shard keys, hot tenants, cross-shard work, and rebalancing.',
        failure:
          'Explain shard key choice, hot tenants, tenant moves, and cross-shard queries.',
      }),
    ],
  },
  {
    slug: 'consistent-ledger',
    version: 1,
    category: 'database',
    topics: ['transactions', 'ledger', 'idempotency', 'audit'],
    estimatedMinutes: 60,
    title: 'Consistent Transaction Ledger',
    summary:
      'Protect balance invariants while making retries and audit evidence explicit.',
    difficulty: 'advanced',
    goal: 'Record money movement exactly once at the business level under retries and failures.',
    traffic: [
      '2K transfers/second',
      'Strict balance invariant',
      'Seven-year audit retention',
    ],
    requirements: [
      'Transactional ledger',
      'Idempotent command handling',
      'Immutable audit evidence',
      'Recoverable storage',
    ],
    constraints: [
      'Network retries occur',
      'No balance derived from cache alone',
      'Explain availability trade-off',
    ],
    initialGraph: {
      nodes: [
        node('client', 'client', 'Payment clients', 70, 200),
        node('gateway', 'api-gateway', 'Payment API', 280, 200, { tls: true }),
        node('service', 'service', 'Ledger service', 520, 200),
        node('database', 'relational-database', 'Ledger database', 780, 200, {
          durable: true,
        }),
      ],
      edges: [
        edge('client-gateway', 'client', 'gateway'),
        edge('gateway-service', 'gateway', 'service'),
        edge('service-database', 'service', 'database', 'transaction'),
      ],
    },
    flows: [
      flow(
        'ledger-write',
        'Ledger transaction',
        'write',
        ['client', 'api-gateway', 'service', 'relational-database'],
        [
          'A client submits an idempotency key.',
          'The API authenticates the command.',
          'The service enforces ledger invariants.',
          'One transaction records balanced entries and the command result.',
        ],
      ),
      flow(
        'audit-copy',
        'Audit copy',
        'replication',
        ['relational-database', 'stream', 'data-warehouse'],
        [
          'Committed ledger changes enter an immutable stream.',
          'The stream preserves audit events.',
          'Analytical storage supports reconciliation without becoming balance authority.',
        ],
      ),
    ],
    rubric: [
      rule({
        id: 'ledger-db',
        conceptId: 'transactional-ledger-authority',
        title: 'Transactional authority',
        category: 'durability',
        check: {
          kind: 'config-equals',
          nodeType: 'relational-database',
          key: 'durable',
          value: true,
        },
        success: 'A durable relational database owns ledger transactions.',
        failure: 'Use a durable relational database as ledger authority.',
      }),
      rule({
        id: 'ledger-idempotent',
        conceptId: 'idempotent-ledger-command',
        title: 'Idempotent command service',
        category: 'requirements',
        check: {
          kind: 'config-equals',
          nodeType: 'service',
          key: 'idempotent',
          value: true,
        },
        success: 'The service handles repeated commands safely.',
        failure: 'Enable idempotent on the ledger service.',
      }),
      rule({
        id: 'ledger-path',
        conceptId: 'authenticated-ledger-path',
        title: 'Explicit transaction boundary',
        category: 'requirements',
        check: {
          kind: 'labeled-edge',
          fromType: 'service',
          toType: 'relational-database',
          label: 'transaction',
        },
        success: 'The ledger write edge names the transaction boundary.',
        failure: 'Label the service-to-database edge “transaction”.',
      }),
      rule({
        id: 'ledger-backup',
        conceptId: 'ledger-recovery-copy',
        title: 'Recovery boundary',
        category: 'availability',
        check: { kind: 'node-present', nodeType: 'backup' },
        success: 'The ledger has an explicit backup and restore boundary.',
        failure: 'Add a backup boundary and plan restore verification.',
      }),
      rule({
        id: 'ledger-tradeoff',
        conceptId: 'ledger-consistency-tradeoff',
        title: 'Ledger trade-off explained',
        category: 'trade-offs',
        check: { kind: 'explanation-length', minLength: 70 },
        success:
          'The design explains atomicity, idempotency, audit, and availability.',
        failure:
          'Explain transaction boundaries, retry keys, recovery, and the availability cost of strict invariants.',
      }),
    ],
  },
];
