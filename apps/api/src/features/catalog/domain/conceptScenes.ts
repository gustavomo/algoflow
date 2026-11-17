import type {
  RuntimeScene,
  RuntimeSceneCellState,
  RuntimeScenePlotPoint,
  RuntimeScenePlotView,
  RuntimeSceneStep,
  RuntimeSceneTableColumn,
  RuntimeSceneTableRow,
  RuntimeSceneTableView,
  RuntimeSceneToken,
} from '@algoflow/contracts';
import {
  ERROR,
  MUTED,
  OK,
  range,
  region,
  step,
  tok,
  withActions,
} from './runtimeScenes';

function cdnScene(): RuntimeScene {
  const miss = 'MISS         /app.css  182 ms';
  const hit = 'HIT          /app.css   14 ms';
  const revalidated = 'REVALIDATED  /app.css   96 ms';
  const cached = (label: string, progress: number, extra = {}) =>
    tok('entry', label, 'cache', { progress, ...extra });
  return {
    code: {
      language: 'http',
      lines: [
        'GET /app.css HTTP/2',
        'host: shop.example',
        '',
        'HTTP/2 200',
        'cache-control: public, max-age=60',
        'etag: "v42"',
        'x-cache: MISS',
        '',
        'HTTP/2 200',
        'age: 12',
        'x-cache: HIT',
        '',
        'GET /app.css HTTP/2',
        'if-none-match: "v42"',
        '',
        'HTTP/2 304',
        'cache-control: public, max-age=60',
      ],
    },
    regions: [
      region('client', 'Client', 'pipeline', 'yellow'),
      region('dns', 'DNS', 'pipeline', 'teal'),
      region('edge', 'CDN edge', 'pipeline', 'orange'),
      region('origin', 'Origin', 'pipeline', 'green'),
      region('cache', 'Edge cache · Madrid', 'box', 'orange'),
      region('console', 'Access log', 'console', 'teal'),
    ],
    steps: [
      step(
        'A browser in Lisbon asks for a stylesheet',
        'The page needs /app.css from shop.example. The server that owns that file, the origin, runs in Virginia: a round trip across the Atlantic. Follow the request to see where it can stop earlier.',
        range(0, 1),
        [tok('req-1', 'GET /app.css', 'client')],
        [],
        ['client'],
      ),
      step(
        'DNS picks the edge, not the origin',
        'shop.example is an alias for the CDN, so the CDN answers the lookup with the address of an edge location near the resolver: Madrid. Routing is decided here, before any HTTP is spoken, which is why the request can end close to the user at all.',
        [1],
        [tok('req-1', 'shop.example → Madrid', 'dns')],
        [],
        ['dns'],
      ),
      step(
        'The edge looks in its cache: miss',
        'The Madrid edge is 9 ms away. It builds a cache key from the host and the path and looks it up. Nothing is stored under that key yet, so the edge cannot answer on its own.',
        range(0, 1),
        [tok('req-1', '/app.css not stored', 'edge', ERROR)],
        [],
        ['edge', 'cache'],
      ),
      step(
        'A miss pays for the long path',
        'Only the origin has the bytes, so the edge forwards the request to Virginia. That single hop is about 140 ms of the total, and every miss pays it again. A CDN does not make the origin faster: it makes it unnecessary for most requests.',
        range(0, 1),
        [tok('req-1', 'fetch · 140 ms', 'origin', { progress: 0.5 })],
        [],
        ['origin'],
      ),
      step(
        "The origin's headers decide what is stored",
        'The origin answers 200 with cache-control: public, max-age=60. That header is the policy, not the CDN: the edge may keep this copy for 60 seconds and serve it to anyone. It stores the response on the way back.',
        range(3, 5),
        [
          tok('req-1', '200 → store copy', 'edge'),
          cached('/app.css · 60 s left', 1),
        ],
        [],
        ['edge', 'cache'],
      ),
      step(
        'First visitor: 182 ms',
        'The first visitor gets the right bytes, slowly. x-cache: MISS records that the edge had to go to the origin. The useful side effect is the copy that now sits in Madrid.',
        [6],
        [
          tok('req-1', '200 · MISS', 'client', OK),
          cached('/app.css · 60 s left', 1),
        ],
        [miss],
        ['client', 'console'],
      ),
      step(
        'Twelve seconds later: a hit',
        'A browser in Porto asks for the same file. DNS sends it to the same edge and the key is identical. The stored copy is 12 seconds old with a 60 second lifetime, so it is still fresh and the edge may use it.',
        range(9, 10),
        [
          tok('req-2', '/app.css found', 'edge', OK),
          cached('/app.css · 48 s left', 0.8, OK),
        ],
        [miss],
        ['edge', 'cache'],
      ),
      step(
        'The hit ends at the edge: 14 ms',
        'The edge answers from its own storage and the origin never sees this request. Latency falls to the short hop and the origin does no work, which is the entire benefit. age: 12 tells the client how old the copy is.',
        range(8, 10),
        [
          tok('req-2', '200 · HIT', 'client', OK),
          cached('/app.css · 48 s left', 0.8),
        ],
        [miss, hit],
        ['client', 'console'],
      ),
      step(
        'After 60 seconds the copy is stale',
        'A third request arrives once the lifetime has run out. The edge still holds the bytes but may no longer trust them: the origin could have shipped a new stylesheet, and serving the old one would be wrong.',
        [4],
        [
          tok('req-3', 'stored but stale', 'edge', ERROR),
          cached('/app.css · stale', 0, MUTED),
        ],
        [miss, hit],
        ['edge', 'cache'],
      ),
      step(
        'Revalidate instead of downloading again',
        'The edge asks the origin a cheaper question: is version "v42" still current? The conditional request carries the etag of the stored copy, so the origin can answer without sending the file.',
        range(12, 13),
        [
          tok('req-3', 'if-none-match "v42"', 'origin'),
          cached('/app.css · stale', 0, MUTED),
        ],
        [miss, hit],
        ['origin'],
      ),
      step(
        '304 Not Modified renews the copy',
        'Nothing changed, so the origin replies 304 with no body. The long hop carries a few hundred bytes instead of the whole file, and the edge resets the lifetime of the copy it already has.',
        range(15, 16),
        [
          tok('req-3', '304 → fresh again', 'edge', OK),
          cached('/app.css · 60 s left', 1, OK),
        ],
        [miss, hit],
        ['edge', 'cache'],
      ),
      step(
        'Three requests, one full origin fetch',
        'The visitor gets the file from the edge in 96 ms. What decided each outcome was never the CDN alone: the cache key says which requests are the same, cache-control says how long a copy is trusted, and the etag makes expiry cheap.',
        [],
        [
          tok('req-3', '200 · REVALIDATED', 'client', OK),
          cached('/app.css · 60 s left', 1),
        ],
        [miss, hit, revalidated],
        ['client', 'console'],
      ),
    ],
  };
}

function containersScene(): RuntimeScene {
  const base = tok('l-base', 'node:22-slim', 'image', MUTED);
  const manifest = tok('l-manifest', 'COPY package*.json', 'image');
  const deps = tok('l-deps', 'RUN npm ci', 'image');
  const src = tok('l-src', 'COPY . .', 'image');
  const layers = [base, manifest, deps, src];
  const toImage = { linkRegionId: 'image' };
  const aLayer = tok('a-rw', 'writable layer: empty', 'a', toImage);
  const bLayer = tok('b-rw', 'writable layer: empty', 'b', toImage);
  const built = 'built shop:1 · 4 layers';
  const removed = 'removed a: config.json edit and cat.png are gone';
  const rebuilt = 'built shop:2 · 3 layers cached, 1 rebuilt';
  return {
    code: {
      language: 'dockerfile',
      lines: [
        'FROM node:22-slim',
        'WORKDIR /app',
        'COPY package*.json ./',
        'RUN npm ci',
        'COPY . .',
        'CMD ["node", "server.js"]',
        '',
        '$ docker build -t shop:1 .',
        '$ docker run -d --name a shop:1',
        '$ docker run -d --name b shop:1',
        '$ docker exec a sh -c "echo debug > config.json"',
        '$ docker rm -f a b',
        '$ docker build -t shop:2 .',
        '$ docker run -d --name a -v data:/data shop:2',
      ],
    },
    regions: [
      region('image', 'Image layers', 'stack', 'green'),
      region('a', 'Container a', 'box', 'orange'),
      region('b', 'Container b', 'box', 'teal'),
      region('volume', 'Host volume', 'box', 'yellow'),
      region('console', 'Terminal', 'console', 'teal'),
    ],
    steps: [
      step(
        "FROM: start on someone else's layers",
        'An image is a stack of read-only filesystem layers. FROM does not copy node:22-slim: it reuses its layers, so every image built on that base shares the same bytes on disk and in the registry.',
        [0],
        [base],
        [],
        ['image'],
      ),
      step(
        'Each filesystem change adds one layer',
        'COPY and RUN each record only what they changed, as a new layer on top. The manifest is copied before the source on purpose: npm ci is slow, and its layer can be reused for as long as package.json stays the same.',
        range(2, 3),
        [base, manifest, deps],
        [],
        ['image'],
      ),
      step(
        'The image is sealed and immutable',
        'COPY . . adds the application layer. CMD adds no files, only metadata about what to run. The result is identified by a digest of its content, so shop:1 means these exact layers on every machine.',
        range(4, 5),
        layers,
        [built],
        ['image', 'console'],
      ),
      step(
        'A container adds one thin writable layer',
        'docker run does not copy the image. It starts a process whose filesystem is the image layers plus one empty writable layer on top. Reads fall through to the layers below, which is why a container starts in milliseconds.',
        [8],
        [...layers, aLayer],
        [built],
        ['a'],
      ),
      step(
        'A second container shares every layer',
        'Container b gets its own process and its own writable layer, but it points at the same read-only layers as a. Ten containers of shop:1 cost one image on disk plus ten thin layers.',
        [9],
        [...layers, aLayer, bLayer],
        [built],
        ['b'],
      ),
      step(
        'Copy-on-write: the first write copies up',
        "config.json lives in the read-only COPY . . layer, so container a cannot change it there. The storage driver first copies the file up into a's writable layer and then edits the copy. From now on a sees its own version, which hides the one below.",
        [10],
        [
          ...layers,
          tok('a-rw', 'writable layer', 'a', toImage),
          tok('a-cfg', 'config.json (copy, edited)', 'a'),
          bLayer,
        ],
        [built],
        ['a', 'image'],
      ),
      step(
        'The image and container b never changed',
        "b still reads the original config.json from the shared layer. Isolation comes from exactly this: every write lands in the writer's own layer, so one container cannot corrupt the image or its siblings.",
        [10],
        [
          ...layers,
          tok('a-rw', 'writable layer', 'a', toImage),
          tok('a-cfg', 'config.json (copy, edited)', 'a'),
          tok('b-rw', 'reads original config.json', 'b', {
            ...toImage,
            ...OK,
          }),
        ],
        [built],
        ['b', 'image'],
      ),
      step(
        'Failure: state hides in the writable layer',
        'Container a has drifted. A hand-edited config and a user upload exist only in its writable layer. No Dockerfile describes them, so nobody can rebuild this container, and no other container can read the upload.',
        [10],
        [
          ...layers,
          tok('a-rw', 'writable layer', 'a', toImage),
          tok('a-cfg', 'config.json (copy, edited)', 'a', ERROR),
          tok('a-upload', 'uploads/cat.png', 'a', ERROR),
          bLayer,
        ],
        [built],
        ['a'],
      ),
      step(
        'Removing a container deletes its layer',
        'A deploy replaces containers. The writable layer lives exactly as long as its container, so the edit and the upload disappear with a. Container b loses nothing because it kept nothing. The image is untouched.',
        [11],
        layers,
        [built, removed],
        ['a', 'console'],
      ),
      step(
        'Recovery: put the change in the image',
        'The config change belongs in the source, so it goes through a rebuild. Only the layer whose input changed is built again: the three layers under it are cache hits, which is the payoff of copying package.json first.',
        [12],
        [
          base,
          tok('l-manifest', 'COPY package*.json · cached', 'image', MUTED),
          tok('l-deps', 'RUN npm ci · cached', 'image', MUTED),
          tok('l-src', 'COPY . . · rebuilt', 'image', OK),
        ],
        [built, removed, rebuilt],
        ['image', 'console'],
      ),
      step(
        'Data that must survive lives in a volume',
        'The new container mounts a volume at /data. Uploads written there are stored on the host, outside any writable layer, so they outlive the container. Now the image is the only description of the software and the container is disposable.',
        [13],
        [
          base,
          tok('l-manifest', 'COPY package*.json', 'image'),
          tok('l-deps', 'RUN npm ci', 'image'),
          tok('l-src', 'COPY . .', 'image'),
          aLayer,
          tok('v-upload', 'uploads/cat.png', 'volume', OK),
        ],
        [built, removed, rebuilt],
        ['a', 'volume'],
      ),
    ],
  };
}

function agentLoopScene(): RuntimeScene {
  const answer = 'Refund r_77 for order #1042 is pending: about 3 days.';
  const budget = (used: string, progress: number) =>
    tok('ctx', `${used} of 8k tokens`, 'context', { progress, ...MUTED });
  const system = tok('m-system', 'system + tool list', 'context', MUTED);
  const goal = tok('m-goal', 'user: refund for #1042?', 'context');
  const call1 = tok('m-call-1', 'call get_order(1042)', 'context');
  const obs1 = tok('m-obs-1', '{returned, refund: r_77}', 'context');
  const call2 = tok('m-call-2', 'call get_refund(r_77)', 'context');
  const obs2 = tok('m-obs-2', '{pending, eta: 3 days}', 'context');
  const call3 = tok('m-call-3', 'call issue_refund(1042)', 'context', ERROR);
  const obs3 = tok('m-obs-3', 'error: not permitted', 'context', ERROR);
  const start = [budget('1.1k', 0.14), system, goal];
  const afterOne = [budget('1.9k', 0.24), system, goal, call1, obs1];
  const afterTwo = [
    budget('2.9k', 0.36),
    system,
    goal,
    call1,
    obs1,
    call2,
    obs2,
  ];
  const afterThree = [
    budget('3.6k', 0.45),
    system,
    goal,
    call1,
    obs1,
    call2,
    obs2,
    call3,
    obs3,
  ];
  const turn = (
    label: string,
    regionId: string,
    extra: Parameters<typeof tok>[3] = {},
  ) => tok('turn', label, regionId, extra);
  return {
    code: {
      language: 'python',
      lines: [
        'messages = [SYSTEM, TOOLS, user_goal]',
        'for turn in range(MAX_TURNS):',
        '    reply = model(messages)',
        '    if reply.tool_call is None:',
        '        return reply.text',
        '    call = reply.tool_call',
        '    if call.name not in ALLOWED:',
        '        result = error("not permitted")',
        '    else:',
        '        result = run_tool(call)',
        '    messages += [reply, result]',
        'raise TurnBudgetExceeded',
      ],
    },
    regions: [
      region('model', 'Model', 'pipeline', 'yellow'),
      region('tool', 'Tool call', 'pipeline', 'orange'),
      region('obs', 'Observation', 'pipeline', 'teal'),
      region('context', 'Context window', 'box', 'green'),
      region('console', 'Reply to the user', 'console', 'yellow'),
    ],
    steps: [
      step(
        'The goal enters the context window',
        'The model has no memory between calls. Everything it will ever know about this task is the list of messages sent with each request: the instructions, the tool descriptions and the goal.',
        [0],
        start,
        [],
        ['context'],
      ),
      step(
        'Turn 1: the model chooses an action',
        'The model reads the whole context and returns either text or a structured tool call. It cannot look anything up by itself, so it asks for the tool whose description fills the gap: it needs the order first.',
        range(1, 2),
        [turn('wants get_order(1042)', 'model'), ...start],
        [],
        ['model'],
      ),
      step(
        'Your code runs the tool, not the model',
        'A tool call is only a request. The harness checks the name against the allow-list, validates the arguments and executes it. This boundary is where permissions are enforced, because the intent of a model is never trusted.',
        range(6, 9),
        [turn('get_order · allowed', 'tool', OK), ...start],
        [],
        ['tool'],
      ),
      step(
        'The observation is appended',
        'The result comes back as data and joins the context together with the call that produced it. Nothing else can ground the next decision: what is not in the context did not happen, as far as the model knows.',
        [10],
        [turn('{returned, refund: r_77}', 'obs'), ...afterOne],
        [],
        ['obs', 'context'],
      ),
      step(
        'Turn 2: same loop, bigger context',
        'The model is called again with everything so far. It now sees the refund id that turn 1 produced and asks about that refund. Every turn sends the full history again, so cost and latency grow with each lap.',
        range(1, 2),
        [turn('wants get_refund(r_77)', 'model'), ...afterOne],
        [],
        ['model'],
      ),
      step(
        'The second result comes back',
        'get_refund is allowed, runs, and returns a pending refund with a three day estimate. Two calls and two results are now in the window. The loop is the same every time: decide, act, observe, append.',
        range(9, 10),
        [turn('{pending, eta: 3 days}', 'obs'), ...afterTwo],
        [],
        ['obs', 'context'],
      ),
      step(
        'Failure: the model reaches too far',
        'With the refund pending, the model tries to help by issuing it again. Nothing inside the model prevents that: it pursues the goal as written. An action that moves money must not depend on the judgement of the model.',
        range(1, 2),
        [turn('wants issue_refund(1042)', 'model', ERROR), ...afterTwo],
        [],
        ['model'],
      ),
      step(
        'The allow-list rejects the call',
        'issue_refund is not in ALLOWED, so the harness never executes it. Least privilege is enforced in code, outside the model, which is why a wrong decision here costs one turn instead of a duplicate refund.',
        range(6, 7),
        [turn('issue_refund · denied', 'tool', ERROR), ...afterTwo],
        [],
        ['tool'],
      ),
      step(
        'The refusal becomes an observation too',
        'The error is returned to the model like any other result. Hiding it would leave the next decision ungrounded, and the model could ask for the same call again until the turn budget ran out.',
        [10],
        [turn('error: not permitted', 'obs', ERROR), ...afterThree],
        [],
        ['obs', 'context'],
      ),
      step(
        'Turn 4: no tool call, so the loop stops',
        'Having read the refusal, the model answers from the evidence it has. A reply without a tool call is the normal stop condition. MAX_TURNS is the other one: it bounds the cost of a loop that never converges.',
        range(2, 4),
        [turn('answers in text', 'model', OK), ...afterThree],
        [answer],
        ['model', 'console'],
      ),
      step(
        'Every claim traces back to an observation',
        'Two results and one refusal sit in the context, so the answer can be checked against evidence. The window is 45% full after four turns: a longer task has to summarise or drop history before it overflows.',
        [],
        afterThree,
        [answer],
        ['context'],
      ),
    ],
  };
}

type Row = RuntimeSceneTableRow;

const FLAT_COLUMNS: RuntimeSceneTableColumn[] = [
  { label: 'order_id', key: 'pk' },
  { label: 'email' },
  { label: 'total' },
];
const CUSTOMER_COLUMNS: RuntimeSceneTableColumn[] = [
  { label: 'id', key: 'pk' },
  { label: 'email' },
];
const ORDER_COLUMNS: RuntimeSceneTableColumn[] = [
  { label: 'id', key: 'pk' },
  { label: 'customer_id', key: 'fk' },
  { label: 'total' },
];

function relationalScene(): RuntimeScene {
  const flat = (rows: Row[]): RuntimeSceneTableView => ({
    regionId: 'flat',
    columns: FLAT_COLUMNS,
    rows,
  });
  const customers = (rows: Row[]): RuntimeSceneTableView => ({
    regionId: 'customers',
    columns: CUSTOMER_COLUMNS,
    rows,
  });
  const orders = (rows: Row[]): RuntimeSceneTableView => ({
    regionId: 'orders',
    columns: ORDER_COLUMNS,
    rows,
  });
  const flatRow = (
    id: number,
    email: string,
    total: number,
    state?: RuntimeSceneCellState,
  ): Row => ({
    id: `f${id}`,
    cells: [String(id), email, String(total)],
    ...(state ? { state, focus: [1] } : {}),
  });
  const customer = (
    id: number,
    email: string,
    state?: RuntimeSceneCellState,
    focus?: number[],
  ): Row => ({
    id: `c${id}`,
    cells: [String(id), email],
    ...(state ? { state } : {}),
    ...(focus ? { focus } : {}),
  });
  const order = (
    id: number,
    customerId: number,
    total: number,
    state?: RuntimeSceneCellState,
    focus?: number[],
  ): Row => ({
    id: `o${id}`,
    cells: [String(id), String(customerId), String(total)],
    link: { regionId: 'customers', rowId: `c${customerId}` },
    ...(state ? { state } : {}),
    ...(focus ? { focus } : {}),
  });
  const tables = (
    base: RuntimeSceneStep,
    ...views: RuntimeSceneTableView[]
  ): RuntimeSceneStep => ({ ...base, tables: views });

  const orphanError = 'ERROR  orders.customer_id = 9 has no row in customers';
  const deleteError = 'ERROR  customers.id = 2 is still referenced by orders';
  const joined = [
    '101 | ana@work.io | 40',
    '102 | ana@work.io | 15',
    '103 | bo@x.io     | 25',
  ];
  const none: RuntimeSceneToken[] = [];
  return {
    code: {
      language: 'sql',
      lines: [
        'CREATE TABLE customers (',
        '  id    INT PRIMARY KEY,',
        '  email TEXT UNIQUE NOT NULL',
        ');',
        'CREATE TABLE orders (',
        '  id          INT PRIMARY KEY,',
        '  customer_id INT NOT NULL REFERENCES customers(id),',
        '  total       NUMERIC CHECK (total > 0)',
        ');',
        "UPDATE customers SET email = 'ana@work.io' WHERE id = 1;",
        'INSERT INTO orders VALUES (104, 9, 20);',
        'DELETE FROM customers WHERE id = 2;',
        'SELECT o.id, c.email, o.total',
        'FROM orders o',
        'JOIN customers c ON c.id = o.customer_id;',
      ],
    },
    regions: [
      region('flat', 'orders_flat', 'table', 'yellow'),
      region('customers', 'customers', 'table', 'teal'),
      region('orders', 'orders', 'table', 'orange'),
      region('console', 'Database output', 'console', 'green'),
    ],
    steps: [
      tables(
        step(
          'One wide table repeats the customer',
          'Every order row carries a copy of the customer\'s email. Ana ordered twice, so her address is stored twice. The table has no single place where the fact "Ana\'s email" lives.',
          [],
          none,
          [],
          ['flat'],
        ),
        flat([
          flatRow(101, 'ana@x.io', 40, 'compare'),
          flatRow(102, 'ana@x.io', 15, 'compare'),
          flatRow(103, 'bo@x.io', 25),
        ]),
      ),
      tables(
        step(
          'Update anomaly: one fact, two values',
          'Ana changes her email and the application updates the row it has at hand. Order 102 still shows the old address. Each row is valid by itself, so nothing in the database can tell which one is true.',
          [],
          none,
          [],
          ['flat'],
        ),
        flat([
          flatRow(101, 'ana@new.io', 40, 'error'),
          flatRow(102, 'ana@x.io', 15, 'error'),
          flatRow(103, 'bo@x.io', 25),
        ]),
      ),
      tables(
        step(
          'Give the entity its own identity',
          'The repeated fact is about a customer, not about an order, so the customer becomes a table of its own with a primary key. id is an identity that never changes, unlike an email. UNIQUE keeps one row per address.',
          range(0, 3),
          none,
          [],
          ['customers'],
        ),
        flat([
          flatRow(101, 'ana@new.io', 40),
          flatRow(102, 'ana@x.io', 15),
          flatRow(103, 'bo@x.io', 25),
        ]),
        customers([
          customer(1, 'ana@new.io', 'sorted'),
          customer(2, 'bo@x.io', 'sorted'),
        ]),
      ),
      tables(
        step(
          'Orders refer to the customer by key',
          'Each order now stores customer_id instead of a copy of the email. That value is a foreign key: it says nothing about the customer except which row to look at. The wide table is no longer needed.',
          range(4, 8),
          none,
          [],
          ['orders'],
        ),
        customers([customer(1, 'ana@new.io'), customer(2, 'bo@x.io')]),
        orders([
          order(101, 1, 40, 'compare', [1]),
          order(102, 1, 15, 'compare', [1]),
          order(103, 2, 25, 'compare', [1]),
        ]),
      ),
      tables(
        step(
          'The same update now touches one row',
          'Ana changes her email again. It is written once, in customers. Both of her orders see it immediately because they never stored it: they follow the key. The anomaly is now impossible, not merely unlikely.',
          [9],
          none,
          [],
          ['customers'],
        ),
        customers([
          customer(1, 'ana@work.io', 'sorted', [1]),
          customer(2, 'bo@x.io'),
        ]),
        orders([
          order(101, 1, 40, 'sorted', [1]),
          order(102, 1, 15, 'sorted', [1]),
          order(103, 2, 25),
        ]),
      ),
      tables(
        step(
          'Failure: an order for nobody',
          'Read line 7 without REFERENCES. This insert would succeed, and order 104 would point at customer 9, who does not exist. A key column is only a number until the database is told it must match a row.',
          [10],
          none,
          [],
          ['orders'],
        ),
        customers([customer(1, 'ana@work.io'), customer(2, 'bo@x.io')]),
        orders([
          order(101, 1, 40),
          order(102, 1, 15),
          order(103, 2, 25),
          order(104, 9, 20, 'error'),
        ]),
      ),
      tables(
        step(
          'The foreign key rejects the orphan',
          'With REFERENCES customers(id) the database checks customer_id on every insert and update. The statement fails as a whole and no row is written, so no code path can forget the check.',
          [6],
          none,
          [orphanError],
          ['orders', 'console'],
        ),
        customers([customer(1, 'ana@work.io'), customer(2, 'bo@x.io')]),
        orders([order(101, 1, 40), order(102, 1, 15), order(103, 2, 25)]),
      ),
      tables(
        step(
          'The constraint guards the other end too',
          'Deleting Bo would leave order 103 pointing at nothing, so the delete is refused by default. A relationship is protected from both sides: you cannot point at a missing row, and you cannot remove a row that is pointed at.',
          [11],
          none,
          [orphanError, deleteError],
          ['customers', 'console'],
        ),
        customers([
          customer(1, 'ana@work.io'),
          customer(2, 'bo@x.io', 'error'),
        ]),
        orders([
          order(101, 1, 40),
          order(102, 1, 15),
          order(103, 2, 25, 'error', [1]),
        ]),
      ),
      tables(
        step(
          'JOIN follows the key back',
          'Splitting the data did not lose the wide view. For each order the join finds the customers row whose id equals customer_id and puts the two side by side: order 101 meets customer 1.',
          range(12, 14),
          none,
          [orphanError, deleteError, joined[0]],
          ['orders', 'customers', 'console'],
        ),
        customers([
          customer(1, 'ana@work.io', 'compare'),
          customer(2, 'bo@x.io'),
        ]),
        orders([
          order(101, 1, 40, 'compare'),
          order(102, 1, 15),
          order(103, 2, 25),
        ]),
      ),
      tables(
        step(
          'One customer row serves many orders',
          "Orders 102 and 103 resolve the same way. Ana's row is read twice but stored once: the join rebuilds the repeated email on demand, always from the single current value.",
          range(12, 14),
          none,
          [orphanError, deleteError, ...joined],
          ['orders', 'customers', 'console'],
        ),
        customers([
          customer(1, 'ana@work.io', 'compare'),
          customer(2, 'bo@x.io', 'compare'),
        ]),
        orders([
          order(101, 1, 40, 'sorted'),
          order(102, 1, 15, 'compare'),
          order(103, 2, 25, 'compare'),
        ]),
      ),
      tables(
        step(
          'Identity, reference, constraint',
          'Each fact lives in exactly one row, found by its primary key. Other tables refer to it by that key, and the foreign key makes a dangling reference impossible to store. The model, not the application, keeps the data true.',
          [],
          none,
          [orphanError, deleteError, ...joined],
          ['orders', 'customers'],
        ),
        customers([
          customer(1, 'ana@work.io', 'sorted'),
          customer(2, 'bo@x.io', 'sorted'),
        ]),
        orders([
          order(101, 1, 40, 'sorted'),
          order(102, 1, 15, 'sorted'),
          order(103, 2, 25, 'sorted'),
        ]),
      ),
    ],
  };
}

type Vec = readonly [number, number];

export const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1];
export const norm = (a: Vec) => Math.hypot(a[0], a[1]);
export const cosine = (a: Vec, b: Vec) => dot(a, b) / (norm(a) * norm(b));
const unit = (a: Vec): Vec => [a[0] / norm(a), a[1] / norm(a)];
const fmt = (value: number) => value.toFixed(2);

/** The toy corpus of the vector lesson: 2D stand-ins for real embeddings. */
export const VECTOR_DOCS: ReadonlyArray<readonly [string, Vec]> = [
  ['kitten', [0.07, 0.42]],
  ['cat', [0.4, 0.76]],
  ['puppy', [0.62, 0.66]],
  ['car', [0.85, 0.22]],
  ['truck', [0.72, 0.08]],
];
export const VECTOR_QUERY: Vec = [0.2, 0.6];

function vectorScene(): RuntimeScene {
  const q = VECTOR_QUERY;
  const vectorOf = new Map(VECTOR_DOCS);
  const names = VECTOR_DOCS.map(([name]) => name);
  const dots = new Map(
    names.map((name) => [name, dot(q, vectorOf.get(name)!)]),
  );
  const cosines = new Map(
    names.map((name) => [name, cosine(q, vectorOf.get(name)!)]),
  );
  const ranked = [...names].sort((a, b) => cosines.get(b)! - cosines.get(a)!);
  const top = ranked.slice(0, 2);
  const degrees = (name: string) =>
    Math.round((Math.acos(cosines.get(name)!) * 180) / Math.PI);

  type PointExtra = Pick<RuntimeScenePlotPoint, 'state' | 'vector'>;
  const points = (
    shown: string[],
    extra: Record<string, PointExtra> = {},
    place: (vector: Vec) => Vec = (vector) => vector,
  ): RuntimeScenePlotPoint[] =>
    shown.map((name) => {
      const [x, y] = place(vectorOf.get(name)!);
      return { id: name, label: name, x, y, ...extra[name] };
    });
  const axes = { x: 'dimension 1', y: 'dimension 2' };
  const query = { label: 'q', x: q[0], y: q[1] };
  const unitQuery = { label: 'q', x: unit(q)[0], y: unit(q)[1] };
  const plot = (
    base: RuntimeSceneStep,
    view: Omit<RuntimeScenePlotView, 'regionId' | 'axes'>,
  ): RuntimeSceneStep => ({
    ...base,
    plots: [{ regionId: 'space', axes, ...view }],
  });
  const score = (
    name: string,
    value: number,
    extra: Parameters<typeof tok>[3] = {},
  ) => tok(`s-${name}`, `${name} ${fmt(value)}`, 'scores', extra);
  const dotScores = names.map((name) =>
    score(
      name,
      dots.get(name)!,
      name === 'car' || name === 'kitten' ? ERROR : {},
    ),
  );
  const cosineScores = ranked.map((name) =>
    score(name, cosines.get(name)!, top.includes(name) ? OK : MUTED),
  );
  const result = `top = ["${top[0]}", "${top[1]}"]`;

  return {
    code: {
      language: 'python',
      lines: [
        'docs = {name: embed(text) for name, text in corpus}',
        'q = embed("baby cat")',
        '',
        'def dot(a, b):',
        '    return sum(x * y for x, y in zip(a, b))',
        '',
        'def cosine(a, b):',
        '    return dot(a, b) / (norm(a) * norm(b))',
        '',
        'unit = {name: v / norm(v) for name, v in docs.items()}',
        'scores = {name: dot(q / norm(q), v) for name, v in unit.items()}',
        'top = sorted(scores, key=scores.get, reverse=True)[:2]',
      ],
    },
    regions: [
      region('space', 'Embedding space', 'plot', 'teal'),
      region('scores', 'Scores against q', 'box', 'orange'),
      region('console', 'Search result', 'console', 'green'),
    ],
    steps: [
      plot(
        step(
          'One text becomes one point',
          'An embedding model turns a text into a list of numbers. Read as coordinates, that list is a point, or an arrow from the origin. Two dimensions are drawn here; real models use hundreds, and the idea is the same.',
          [0],
          [],
          [],
          ['space'],
        ),
        {
          points: points(['cat'], { cat: { vector: true, state: 'compare' } }),
        },
      ),
      plot(
        step(
          'Similar meaning lands close together',
          'The model was trained so that texts used in similar contexts get similar coordinates. Nobody wrote a rule about animals: kitten, cat and puppy end up in one region, car and truck in another.',
          [0],
          [],
          [],
          ['space'],
        ),
        { points: points(names) },
      ),
      plot(
        step(
          'The query goes through the same model',
          'Search begins by embedding the question with the same model and the same preprocessing as the documents. A different model would place q in a different space, where its distance to these points means nothing.',
          [1],
          [],
          [],
          ['space'],
        ),
        { points: points(names), query },
      ),
      plot(
        step(
          'Dot product: multiply aligned components',
          'The dot product multiplies the two vectors one dimension at a time and adds the results. It is large when both vectors are large in the same dimensions, so it rewards pointing the same way.',
          range(3, 4),
          [score('cat', dots.get('cat')!)],
          [],
          ['space', 'scores'],
        ),
        {
          points: points(names, { cat: { vector: true, state: 'compare' } }),
          query,
        },
      ),
      plot(
        step(
          'Failure: the dot product rewards length',
          `car scores ${fmt(dots.get('car')!)} and kitten only ${fmt(dots.get('kitten')!)}, although kitten points almost exactly where q does. The dot product also grows with the length of each vector, and car is simply longer. Length says nothing about meaning here.`,
          range(3, 4),
          dotScores,
          [],
          ['scores'],
        ),
        {
          points: points(names, {
            car: { vector: true, state: 'error' },
            kitten: { vector: true, state: 'error' },
          }),
          query,
        },
      ),
      plot(
        step(
          'Cosine: divide the lengths away',
          `Dividing by both lengths leaves only the angle between the vectors. q and kitten are ${degrees('kitten')}° apart, so their cosine is ${fmt(cosines.get('kitten')!)}: nearly the same direction, however short kitten is.`,
          range(6, 7),
          names.map((name) =>
            name === 'kitten'
              ? score(name, cosines.get(name)!, OK)
              : score(name, dots.get(name)!, MUTED),
          ),
          [],
          ['space', 'scores'],
        ),
        {
          points: points(names, { kitten: { vector: true, state: 'sorted' } }),
          query,
          angle: {
            pointId: 'kitten',
            label: `cos ${fmt(cosines.get('kitten')!)}`,
          },
        },
      ),
      plot(
        step(
          'A wide angle is a different meaning',
          `car is ${degrees('car')}° away from q. Its length no longer helps: the cosine falls to ${fmt(cosines.get('car')!)}, far below kitten. The ranking now follows direction, which is where the model stored meaning.`,
          range(6, 7),
          names.map((name) =>
            name === 'kitten'
              ? score(name, cosines.get(name)!, OK)
              : name === 'car'
                ? score(name, cosines.get(name)!, ERROR)
                : score(name, dots.get(name)!, MUTED),
          ),
          [],
          ['space', 'scores'],
        ),
        {
          points: points(names, { car: { vector: true, state: 'swap' } }),
          query,
          angle: { pointId: 'car', label: `cos ${fmt(cosines.get('car')!)}` },
        },
      ),
      plot(
        step(
          'Normalise once, then a dot product is enough',
          'Scaling every vector to length 1 moves all of them onto one arc without changing any angle. On that arc the dot product equals the cosine, so an index can store unit vectors and use the cheaper operation for every comparison.',
          range(9, 10),
          names.map((name) => score(name, cosines.get(name)!)),
          [],
          ['space', 'scores'],
        ),
        { points: points(names, {}, unit), query: unitQuery, unitArc: true },
      ),
      plot(
        step(
          'The nearest neighbours are the answer',
          `Sort by score and keep the best two: ${top[0]} and ${top[1]} are the closest directions to "baby cat". ${top[0]} ranks first although it shares no word with the query. That is the difference from keyword search.`,
          [11],
          cosineScores,
          [result],
          ['space', 'scores', 'console'],
        ),
        {
          points: points(
            names,
            Object.fromEntries(
              names.map((name) => [
                name,
                { state: top.includes(name) ? 'sorted' : 'visited' },
              ]),
            ),
            unit,
          ),
          query: unitQuery,
          neighbours: top,
          unitArc: true,
        },
      ),
      plot(
        step(
          'Geometry stood in for meaning',
          'Texts became coordinates, direction carried what they mean, and similarity became an angle a computer can sort by. It only holds while documents and queries share one model and one preprocessing path.',
          [],
          cosineScores,
          [result],
          ['space'],
        ),
        {
          points: points(
            names,
            Object.fromEntries(
              names.map((name) => [
                name,
                { state: top.includes(name) ? 'sorted' : 'visited' },
              ]),
            ),
            unit,
          ),
          query: unitQuery,
          neighbours: top,
          unitArc: true,
        },
      ),
    ],
  };
}

export const cdnRuntimeScene = withActions(cdnScene(), [
  ['GET shop.example/app.css', 'compare'],
  ['shop.example → CNAME → edge Madrid', 'swap'],
  ['cache.get(host + path) → MISS', 'error'],
  ['edge → origin (Virginia) · 140 ms', 'swap'],
  ['cache.set(key, 200, max-age = 60 s)', 'swap'],
  ['x-cache: MISS · 182 ms', 'ok'],
  ['cache.get(key) → HIT · age 12 < 60', 'ok'],
  ['x-cache: HIT · 14 ms · origin not called', 'ok'],
  ['age 75 > max-age 60 → stale', 'error'],
  ['if-none-match: "v42" → origin', 'compare'],
  ['304 Not Modified → ttl reset to 60 s', 'ok'],
  ['MISS 182 ms · HIT 14 ms · REVALIDATED 96 ms', 'ok'],
]);

export const containersRuntimeScene = withActions(containersScene(), [
  ['FROM node:22-slim → reuse base layers', 'compare'],
  ['COPY package*.json · RUN npm ci → +2 layers', 'swap'],
  ['docker build → shop:1 = 4 layers', 'ok'],
  ['docker run a → image + 1 writable layer', 'swap'],
  ['docker run b → same layers, own layer', 'swap'],
  ['write config.json → copy up → edit copy', 'swap'],
  ['b: cat config.json → original', 'ok'],
  ['a: 2 files exist in no image', 'error'],
  ['docker rm a → writable layer deleted', 'error'],
  ['docker build shop:2 → 3 cached, 1 rebuilt', 'ok'],
  ['-v data:/data → uploads outlive a', 'ok'],
]);

export const agentLoopRuntimeScene = withActions(agentLoopScene(), [
  ['messages = [system, tools, goal]', 'compare'],
  ['model(messages) → get_order(1042)', 'compare'],
  ['get_order ∈ ALLOWED → run_tool', 'ok'],
  ['messages += [call, result] → 1.9k', 'swap'],
  ['model(messages) → get_refund(r_77)', 'compare'],
  ['messages += [call, result] → 2.9k', 'swap'],
  ['model(messages) → issue_refund(1042)', 'error'],
  ['issue_refund ∉ ALLOWED → not run', 'error'],
  ['messages += [call, error] → 3.6k', 'swap'],
  ['reply.tool_call is None → return', 'ok'],
  ['4 turns · 3.6k of 8k tokens', 'ok'],
]);

export const relationalRuntimeScene = withActions(relationalScene(), [
  ['ana@x.io stored 2×', 'compare'],
  ['UPDATE … WHERE order_id = 101 → 1 of 2 rows', 'error'],
  ['customers(id PRIMARY KEY, email UNIQUE)', 'swap'],
  ['orders.customer_id → customers.id', 'swap'],
  ['UPDATE customers … WHERE id = 1 → 1 row', 'ok'],
  ['INSERT (104, 9, 20) → customer 9 ?', 'error'],
  ['REFERENCES customers(id) → insert rejected', 'ok'],
  ['DELETE customers 2 → still referenced', 'error'],
  ['o.customer_id = 1 → c.id = 1', 'compare'],
  ['3 orders ⋈ 2 customers → 3 rows', 'ok'],
  ['1 fact · 1 row · 1 key', 'ok'],
]);

const CAT = VECTOR_DOCS[1][1];

export const vectorRuntimeScene = withActions(vectorScene(), [
  ['embed("cat") → [0.40, 0.76]', 'compare'],
  ['5 texts → 5 points', 'swap'],
  ['embed("baby cat") → q = [0.20, 0.60]', 'swap'],
  [
    `${VECTOR_QUERY[0]}×${CAT[0]} + ${VECTOR_QUERY[1]}×${CAT[1]} = ${fmt(dot(VECTOR_QUERY, CAT))}`,
    'compare',
  ],
  ['q·car > q·kitten ✗ longer, not closer', 'error'],
  ['cos = q·kitten / (|q| × |kitten|)', 'ok'],
  ['cos(q, car) ≪ cos(q, kitten)', 'ok'],
  ['v / |v| → every vector has length 1', 'swap'],
  ['sorted(scores)[:2] → nearest two', 'ok'],
  ['text → vector → angle → ranking', 'ok'],
]);
