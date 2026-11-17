import type {
  RuntimeScene,
  RuntimeSceneActionTone,
  RuntimeSceneRegion,
  RuntimeSceneStep,
  RuntimeSceneToken,
} from '@algoflow/contracts';

type TokenExtra = Pick<RuntimeSceneToken, 'tone' | 'linkRegionId' | 'progress'>;

const region = (
  id: string,
  label: string,
  kind: RuntimeSceneRegion['kind'],
  tone: RuntimeSceneRegion['tone'],
): RuntimeSceneRegion => ({ id, label, kind, tone });

const tok = (
  id: string,
  label: string,
  regionId: string,
  extra: TokenExtra = {},
): RuntimeSceneToken => ({ id, label, regionId, ...extra });

/** One full snapshot. `codeLines` should be a contiguous zero-based range. */
const step = (
  label: string,
  narration: string,
  codeLines: number[],
  tokens: RuntimeSceneToken[],
  output: string[],
  activeRegionIds: string[] = [],
): RuntimeSceneStep => ({
  label,
  narration,
  codeLines,
  tokens,
  output,
  activeRegionIds,
});

type ActionCaption = [text: string, tone: RuntimeSceneActionTone] | null;

/**
 * Attaches one action caption per step, in step order. `null` leaves a step
 * without a caption, for steps that only frame or summarise.
 */
export function withActions(
  scene: RuntimeScene,
  captions: ActionCaption[],
): RuntimeScene {
  if (captions.length !== scene.steps.length)
    throw new Error(
      `Expected ${scene.steps.length} action captions, received ${captions.length}`,
    );
  return {
    ...scene,
    steps: scene.steps.map((item, index) => {
      const caption = captions[index];
      return caption
        ? { ...item, action: { text: caption[0], tone: caption[1] } }
        : item;
    }),
  };
}

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index);

const OK = { tone: 'ok' } as const;
const ERROR = { tone: 'error' } as const;
const MUTED = { tone: 'muted' } as const;

function closuresScene(): RuntimeScene {
  const script = tok('script', 'script', 'stack', MUTED);
  const fn = tok('fn', 'createCounter: ƒ', 'global', MUTED);
  const a = tok('a', 'a: {…}', 'global', {
    linkRegionId: 'scope-1',
  });
  const b = tok('b', 'b: {…}', 'global', {
    linkRegionId: 'scope-2',
  });
  const count1 = (value: number, extra: TokenExtra = {}) =>
    tok('count-1', `count = ${value}`, 'scope-1', extra);
  const count2 = tok('count-2', 'count = 10', 'scope-2');
  return {
    code: {
      language: 'javascript',
      lines: [
        'function createCounter(start = 0) {',
        '  let count = start;',
        '  return {',
        '    increment: () => ++count,',
        '    current: () => count,',
        '  };',
        '}',
        '',
        'const a = createCounter();',
        'const b = createCounter(10);',
        'a.increment();',
        'a.increment();',
        'console.log(a.current(), b.current()); // 2 10',
      ],
    },
    regions: [
      region('stack', 'Call Stack', 'stack', 'yellow'),
      region('global', 'Global scope', 'box', 'teal'),
      region('scope-1', 'Scope #1', 'box', 'orange'),
      region('scope-2', 'Scope #2', 'box', 'green'),
      region('console', 'Console', 'console', 'red'),
    ],
    steps: [
      step(
        'The script starts in the global scope',
        'The engine pushes the script and records createCounter in the global scope. The function body has not run, so no count binding exists anywhere yet.',
        range(0, 6),
        [script, fn],
        [],
        ['stack', 'global'],
      ),
      step(
        'a = createCounter(): a call creates a scope',
        'Calling the function pushes a frame and creates a brand new scope for this call. count is a binding inside that scope, initialised from start = 0.',
        [1],
        [
          script,
          tok('call-1', 'createCounter()', 'stack', {
            linkRegionId: 'scope-1',
          }),
          fn,
          count1(0),
        ],
        [],
        ['stack', 'scope-1'],
      ),
      step(
        'The returned functions close over count',
        'increment and current are created inside scope #1, so each one keeps a reference to that scope. They capture the binding itself, not a copy of the value 0.',
        range(2, 5),
        [
          script,
          tok('call-1', 'createCounter()', 'stack', {
            linkRegionId: 'scope-1',
          }),
          fn,
          count1(0),
        ],
        [],
        ['scope-1'],
      ),
      step(
        'The frame pops, the scope survives',
        'createCounter has returned and its frame is gone. Normally its locals would become unreachable, but a still holds two functions that reference scope #1, so the engine keeps count alive.',
        [8],
        [script, fn, a, count1(0)],
        [],
        ['global', 'scope-1'],
      ),
      step(
        'b = createCounter(10): a second scope',
        'A second call does not reuse scope #1. It creates scope #2 with its own count binding. One binding is created per call, which is why the counters cannot share state.',
        [1],
        [
          script,
          tok('call-2', 'createCounter(10)', 'stack', {
            linkRegionId: 'scope-2',
          }),
          fn,
          a,
          count1(0),
          count2,
        ],
        [],
        ['stack', 'scope-2'],
      ),
      step(
        'Two closures, two private bindings',
        'Both frames are gone and both scopes are still alive, each reachable only through its own object. Nothing in the global scope can touch either count directly.',
        [9],
        [script, fn, a, b, count1(0), count2],
        [],
        ['global', 'scope-1', 'scope-2'],
      ),
      step(
        'a.increment() writes into scope #1',
        'The arrow function runs in a new frame, but it resolves count through the scope where it was written: scope #1. ++count updates that binding in place.',
        [3],
        [
          script,
          tok('inc-1', 'increment()', 'stack', { linkRegionId: 'scope-1' }),
          fn,
          a,
          b,
          count1(1, OK),
          count2,
        ],
        [],
        ['stack', 'scope-1'],
      ),
      step(
        'The second increment finds the same binding',
        'A new frame, the same scope. The closure remembers the binding between calls, so count goes from 1 to 2. Scope #2 was never involved and still holds 10.',
        [3],
        [
          script,
          tok('inc-2', 'increment()', 'stack', { linkRegionId: 'scope-1' }),
          fn,
          a,
          b,
          count1(2, OK),
          count2,
        ],
        [],
        ['stack', 'scope-1'],
      ),
      step(
        'current() reads each scope when it is called',
        'a.current() reads scope #1 and b.current() reads scope #2. A closure reads its binding at call time, so the output shows the latest values: 2 and 10.',
        [12],
        [
          script,
          tok('log', 'console.log(2, 10)', 'stack'),
          fn,
          a,
          b,
          count1(2),
          count2,
        ],
        ['2 10'],
        ['scope-1', 'scope-2', 'console'],
      ),
      step(
        'Private, independent state',
        'The script is done and the stack is empty, yet both scopes live on for as long as a and b are reachable. Name the binding, count how many times it was created, and decide when it is read: those three answers predict any closure.',
        [],
        [fn, a, b, count1(2), count2],
        ['2 10'],
      ),
    ],
  };
}

function asyncScene(): RuntimeScene {
  const clock = (ms: number) => tok('clock', `t = ${ms} ms`, 'clock', MUTED);
  const flying = (id: string, user: number, progress: number) =>
    tok(id, `loadUser(${user})`, 'flight', { progress });
  const done = (id: string, user: number) =>
    tok(id, `user ${user}`, 'settled', OK);
  const sequential = 'sequential: 300 ms';
  const concurrent = 'Promise.all: 100 ms';
  const failFast = 'Promise.all rejected at 40 ms: HTTP 500';
  const settled = 'allSettled: fulfilled, rejected, fulfilled';
  const aborted = 'TimeoutError at 100 ms: request cancelled';
  return {
    code: {
      language: 'javascript',
      lines: [
        'const ids = [1, 2, 3];',
        '',
        '// Sequential: total time is the sum of every request.',
        'for (const id of ids) await loadUser(id);',
        '',
        '// Concurrent: total time is close to the slowest request.',
        'const users = await Promise.all(ids.map(loadUser));',
        '',
        '// Every outcome: wait for all, never fail fast.',
        'const results = await Promise.allSettled(ids.map(loadUser));',
        '',
        '// Cancellation: the signal stops the request itself.',
        'const response = await fetch(url, { signal: AbortSignal.timeout(100) });',
      ],
    },
    regions: [
      region('flight', 'In flight', 'box', 'teal'),
      region('settled', 'Settled', 'box', 'green'),
      region('clock', 'Elapsed', 'box', 'yellow'),
      region('console', 'Console', 'console', 'red'),
    ],
    steps: [
      step(
        'Three independent requests',
        'Each loadUser call takes about 100 ms and none depends on another. The code decides only one thing: when each request starts.',
        [0],
        [clock(0)],
        [],
        ['clock'],
      ),
      step(
        'Sequential: await inside the loop',
        'await pauses the loop until user 1 settles. Requests 2 and 3 have not even started, although nothing stops them from running now.',
        [3],
        [flying('seq-1', 1, 0.5), clock(50)],
        [],
        ['flight'],
      ),
      step(
        'One settles, only then the next starts',
        'User 1 arrived at 100 ms, so the loop resumes and starts request 2. The network sat idle for nothing: at most one request is ever in flight.',
        [3],
        [done('seq-1', 1), flying('seq-2', 2, 0.5), clock(150)],
        [],
        ['flight', 'settled'],
      ),
      step(
        'The third request waits for the second',
        'The same pause again. Every iteration adds its full duration to the total.',
        [3],
        [
          done('seq-1', 1),
          done('seq-2', 2),
          flying('seq-3', 3, 0.5),
          clock(250),
        ],
        [],
        ['flight', 'settled'],
      ),
      step(
        'Sequential total: the sum',
        'Three requests of 100 ms took 300 ms. Sequential awaits are correct when each step needs the previous result, and wasteful when it does not.',
        [3],
        [done('seq-1', 1), done('seq-2', 2), done('seq-3', 3), clock(300)],
        [sequential],
        ['settled', 'clock', 'console'],
      ),
      step(
        'Promise.all: start everything, wait once',
        'ids.map(loadUser) calls loadUser three times before any await, so all three requests are in flight together. Promise.all only combines the promises that are already running.',
        [6],
        [
          flying('all-1', 1, 0.5),
          flying('all-2', 2, 0.5),
          flying('all-3', 3, 0.5),
          clock(50),
        ],
        [sequential],
        ['flight'],
      ),
      step(
        'Concurrent total: the slowest request',
        'All three settle around 100 ms and Promise.all fulfills with the results in input order. Same work, a third of the time.',
        [6],
        [done('all-1', 1), done('all-2', 2), done('all-3', 3), clock(100)],
        [sequential, concurrent],
        ['settled', 'clock', 'console'],
      ),
      step(
        'One rejection fails Promise.all fast',
        'Now request 2 fails after 40 ms. Promise.all rejects at once with that error. Requests 1 and 3 are not cancelled: they keep running and their results are thrown away.',
        [6],
        [
          flying('fail-1', 1, 0.4),
          flying('fail-3', 3, 0.4),
          tok('fail-2', 'loadUser(2): HTTP 500', 'settled', ERROR),
          clock(40),
        ],
        [sequential, concurrent, failFast],
        ['flight', 'settled', 'console'],
      ),
      step(
        'allSettled waits for every outcome',
        'Promise.allSettled never rejects. It waits for all three and reports each result as fulfilled or rejected, so one failure does not hide two successes.',
        [9],
        [
          tok('set-1', 'fulfilled: user 1', 'settled', OK),
          tok('set-2', 'rejected: HTTP 500', 'settled', ERROR),
          tok('set-3', 'fulfilled: user 3', 'settled', OK),
          clock(100),
        ],
        [sequential, concurrent, failFast, settled],
        ['settled', 'console'],
      ),
      step(
        'A slow request needs a real cancel',
        'This request will take far longer than we are willing to wait. Racing it against a timer with Promise.race would only stop waiting: the request itself would keep running.',
        [12],
        [tok('slow', 'fetch(url)', 'flight', { progress: 0.3 }), clock(99)],
        [sequential, concurrent, failFast, settled],
        ['flight', 'clock'],
      ),
      step(
        'The signal aborts the work itself',
        'At 100 ms the signal fires and fetch tears the request down, then rejects. AbortSignal.timeout rejects with a TimeoutError; calling controller.abort() yourself gives an AbortError.',
        [12],
        [tok('slow', 'TimeoutError', 'settled', ERROR), clock(100)],
        [sequential, concurrent, failFast, settled, aborted],
        ['settled', 'console'],
      ),
      step(
        'Pick the failure policy, then the combinator',
        'Start independent work together and wait once. Use all to fail fast, allSettled to collect every outcome, and pass a signal whenever abandoned work must actually stop.',
        [],
        [],
        [sequential, concurrent, failFast, settled, aborted],
      ),
    ],
  };
}

function narrowingScene(): RuntimeScene {
  const labels = {
    ok: "{ status: 'ok' }",
    error: "{ status: 'error' }",
    loading: "{ status: 'loading' }",
    cancelled: "{ status: 'cancelled' }",
  };
  type Member = keyof typeof labels;
  const member = (name: Member, regionId: string, extra: TokenExtra = {}) =>
    tok(`member-${name}`, labels[name], regionId, extra);
  const handled = (...names: Member[]) =>
    names.map((name) => member(name, 'handled', MUTED));
  const never = tok('never', 'never', 'here', OK);
  const proven = '✓ default: result is never';
  const rejected =
    "✗ TS2345: '{ status: \"cancelled\" }' is not assignable to 'never'";
  const fixed = "✓ case 'cancelled' added: result is never again";
  return {
    code: {
      language: 'typescript',
      lines: [
        'type Result =',
        "  | { status: 'ok'; data: string }",
        "  | { status: 'error'; message: string }",
        "  | { status: 'loading' };",
        '',
        'function label(result: Result): string {',
        '  switch (result.status) {',
        "    case 'ok':",
        "      return 'Done';",
        "    case 'error':",
        "      return 'Failed';",
        "    case 'loading':",
        "      return 'Waiting';",
        '    default:',
        '      return assertNever(result);',
        '  }',
        '}',
      ],
    },
    regions: [
      region('here', 'Type of result on this line', 'box', 'teal'),
      region('later', 'Left for later cases', 'box', 'yellow'),
      region('handled', 'Ruled out by earlier cases', 'box', 'orange'),
      region('console', 'Compiler', 'console', 'red'),
    ],
    steps: [
      step(
        'A union: three possible shapes',
        'Result can be any one of three object types. Each carries a status field with a different literal value: that field is the discriminant.',
        range(0, 3),
        [
          member('ok', 'here'),
          member('error', 'here'),
          member('loading', 'here'),
        ],
        [],
        ['here'],
      ),
      step(
        'Before any check, only shared fields are safe',
        'Inside label, result is still all three members at once. Only status exists on every one of them, so reading result.data here would not compile.',
        range(5, 6),
        [
          member('ok', 'here'),
          member('error', 'here'),
          member('loading', 'here'),
        ],
        [],
        ['here'],
      ),
      step(
        "case 'ok' proves one member",
        "Only one member has status 'ok', so inside this case TypeScript removes the other two. result.data is now safe: the check is the proof.",
        range(7, 8),
        [
          member('ok', 'here', OK),
          member('error', 'later'),
          member('loading', 'later'),
        ],
        [],
        ['here', 'later'],
      ),
      step(
        "case 'error': one candidate fewer",
        "The 'ok' member was handled above and cannot reach this line. Of the two left, the check selects the error member, so result.message is available.",
        range(9, 10),
        [
          member('error', 'here', OK),
          member('loading', 'later'),
          ...handled('ok'),
        ],
        [],
        ['here', 'handled'],
      ),
      step(
        "case 'loading': the last member",
        'Control-flow analysis keeps subtracting. After this case, every member of the union has been ruled out by an earlier branch.',
        range(11, 12),
        [member('loading', 'here', OK), ...handled('ok', 'error')],
        [],
        ['here', 'handled'],
      ),
      step(
        'default: nothing is left, so never',
        'With all three members removed, the type of result is never: the empty type. assertNever accepts only never, so this line compiles exactly when every case is handled.',
        range(13, 14),
        [never, ...handled('ok', 'error', 'loading')],
        [proven],
        ['here', 'console'],
      ),
      step(
        'A teammate adds a fourth member',
        "Suppose someone later adds | { status: 'cancelled' } to Result and forgets to update label. The union entering the switch now has four members.",
        range(0, 3),
        [
          member('ok', 'here'),
          member('error', 'here'),
          member('loading', 'here'),
          member('cancelled', 'here'),
        ],
        [proven],
        ['here'],
      ),
      step(
        'The forgotten member reaches default',
        'Three cases remove three members, and the fourth falls through. result is no longer never, so passing it to assertNever is a compile error at the exact line that forgot it.',
        range(13, 14),
        [
          member('cancelled', 'here', ERROR),
          ...handled('ok', 'error', 'loading'),
        ],
        [proven, rejected],
        ['here', 'console'],
      ),
      step(
        'Handle the case and never returns',
        "Adding case 'cancelled' rules the new member out before default. The leftover type is never again and the program compiles.",
        range(13, 14),
        [never, ...handled('ok', 'error', 'loading', 'cancelled')],
        [proven, rejected, fixed],
        ['here', 'handled', 'console'],
      ),
      step(
        'Compile-time proof, runtime guard',
        'Narrowing turns your checks into proofs the compiler tracks line by line. The throw inside assertNever still matters at runtime, when JSON from outside carries a status the types never saw.',
        [14],
        [never, ...handled('ok', 'error', 'loading', 'cancelled')],
        [proven, rejected, fixed],
      ),
    ],
  };
}

function genericsScene(): RuntimeScene {
  const tSlot = tok('t-slot', 'T = ?', 'type-t', MUTED);
  const kSlot = tok('k-slot', 'K = ?', 'type-k', MUTED);
  const retSlot = tok('ret-slot', 'T[K] = ?', 'ret', MUTED);
  const tBound = tok(
    'arg-obj',
    'T = { id: number; name: string }',
    'type-t',
    OK,
  );
  const keyOf = tok('keyof', "keyof T = 'id' | 'name'", 'type-k', MUTED);
  const idLine = 'const id: number';
  const nameLine = 'const name: string';
  const errorLine =
    'TS2345: \'"email"\' is not assignable to parameter of type \'"id" | "name"\'';
  return {
    code: {
      language: 'typescript',
      lines: [
        'function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {',
        '  return obj[key];',
        '}',
        '',
        "const user = { id: 7, name: 'Ada' };",
        "const id = getProperty(user, 'id'); // number",
        "const name = getProperty(user, 'name'); // string",
        "// getProperty(user, 'email'); // error: not a key of user",
      ],
    },
    regions: [
      region('call', 'Call site arguments', 'box', 'yellow'),
      region('type-t', 'T', 'box', 'teal'),
      region('type-k', 'K extends keyof T', 'box', 'orange'),
      region('ret', 'Return type T[K]', 'box', 'green'),
      region('console', 'Compiler', 'console', 'red'),
    ],
    steps: [
      step(
        'A signature with empty slots',
        'T and K are variables for types. The signature does not know them yet; it only promises how they relate: key must be a key of obj, and the result is the type of that property.',
        [0],
        [tSlot, kSlot, retSlot],
        [],
        ['type-t', 'type-k', 'ret'],
      ),
      step(
        'The call site supplies the arguments',
        'Nobody writes getProperty<...> by hand. TypeScript looks at the arguments of this call and infers what each slot must be.',
        range(4, 5),
        [
          tok('arg-obj', 'user', 'call'),
          tok('arg-id', "'id'", 'call'),
          tSlot,
          kSlot,
          retSlot,
        ],
        [],
        ['call'],
      ),
      step(
        'T binds to the type of user',
        'obj is declared as T and receives user, so T becomes { id: number; name: string } for this call. Every other T in the signature now means exactly that.',
        [5],
        [tok('arg-id', "'id'", 'call'), tBound, kSlot, retSlot],
        [],
        ['call', 'type-t'],
      ),
      step(
        'The constraint is computed from T',
        "K extends keyof T is not a fixed rule: it depends on the T that was just bound. For this user, keyof T is the union 'id' | 'name'.",
        [0],
        [tok('arg-id', "'id'", 'call'), tBound, keyOf, retSlot],
        [],
        ['type-t', 'type-k'],
      ),
      step(
        "K binds to the literal 'id'",
        "The second argument is checked against the constraint and passes. K is inferred as the literal type 'id', not the wide type string. That precision is what makes the next step possible.",
        [5],
        [tBound, keyOf, tok('arg-id', "K = 'id'", 'type-k', OK), retSlot],
        [],
        ['call', 'type-k'],
      ),
      step(
        'The return type is looked up, not guessed',
        "T[K] is an indexed access: the type of property 'id' in T. The compiler evaluates it to number, so id is a number with no cast.",
        [5],
        [
          tBound,
          keyOf,
          tok('arg-id', "K = 'id'", 'type-k', OK),
          tok('ret-id', "T['id'] = number", 'ret', OK),
        ],
        [idLine],
        ['ret', 'console'],
      ),
      step(
        'Second call: same T, a new K',
        "Each call binds the slots again. T is the same object type, K is now 'name', and the same signature produces a different return type: string.",
        [6],
        [
          tBound,
          keyOf,
          tok('arg-name', "K = 'name'", 'type-k', OK),
          tok('ret-name', "T['name'] = string", 'ret', OK),
        ],
        [idLine, nameLine],
        ['type-k', 'ret', 'console'],
      ),
      step(
        'A key that does not exist',
        "Uncomment the last line. T binds as before, and the argument 'email' arrives to be checked against keyof T.",
        [7],
        [tok('arg-email', "'email'", 'call'), tBound, keyOf, retSlot],
        [idLine, nameLine],
        ['call'],
      ),
      step(
        'The constraint rejects it before it runs',
        "'email' is not in 'id' | 'name', so K cannot bind and the call does not compile. The mistake is caught at the call site instead of returning undefined at runtime.",
        [7],
        [
          tBound,
          keyOf,
          tok('arg-email', "'email' is not a key", 'type-k', ERROR),
          retSlot,
        ],
        [idLine, nameLine, errorLine],
        ['type-k', 'console'],
      ),
      step(
        'What the type parameters bought',
        'With any, all three calls would compile and return any. The generic ties the positions together: the key is checked against the object, and the result type is computed from both.',
        [0],
        [tBound, keyOf, retSlot],
        [idLine, nameLine, errorLine],
      ),
    ],
  };
}

function negativeSpaceScene(): RuntimeScene {
  const balance = (value: number, extra: TokenExtra = {}) =>
    tok('balance', `balance = ${value}`, 'ledger', extra);
  const okLine = 'withdraw(100, 30) → 70';
  const stopped = 'Error: Assertion failed: withdrawal never exceeds balance';
  const silent = 'withdraw(70, 130) → -60 (no assertions, no error)';
  const late = 'days later: reconciliation mismatch, cause unknown';
  const caught = 'Error: Assertion failed: balance never becomes negative';
  return {
    code: {
      language: 'typescript',
      lines: [
        'function withdraw(balance: number, amount: number): number {',
        '  assert(',
        '    Number.isInteger(amount) && amount > 0,',
        "    'amount is a positive integer',",
        '  );',
        "  assert(amount <= balance, 'withdrawal never exceeds balance');",
        '  const next = balance - amount;',
        "  assert(next >= 0, 'balance never becomes negative');",
        '  return next;',
        '}',
      ],
    },
    regions: [
      region('input', 'Boundary input', 'pipeline', 'yellow'),
      region('pre', 'Preconditions', 'pipeline', 'teal'),
      region('op', 'Operation', 'pipeline', 'orange'),
      region('post', 'Postcondition', 'pipeline', 'teal'),
      region('ledger', 'Persisted balance', 'box', 'green'),
      region('downstream', 'Downstream copies', 'box', 'orange'),
      region('console', 'Process log', 'console', 'red'),
    ],
    steps: [
      step(
        'A valid call arrives at the boundary',
        'withdraw(100, 30) enters the function. The stored balance is 100. Before touching anything, the function states what must be true for it to be correct.',
        [0],
        [tok('call-a', 'withdraw(100, 30)', 'input'), balance(100)],
        [],
        ['input'],
      ),
      step(
        'Precondition 1: a positive integer',
        'The type says number, which still admits -5, NaN and 0.5. The first assertion excludes those values, the ones a type cannot see.',
        range(1, 4),
        [tok('call-a', '30 is an integer > 0 ✓', 'pre', OK), balance(100)],
        [],
        ['pre'],
      ),
      step(
        'Precondition 2: never more than the balance',
        'The second assertion checks a relationship between two arguments. 30 ≤ 100 holds, so the caller has met its obligations.',
        [5],
        [tok('call-a', '30 ≤ 100 ✓', 'pre', OK), balance(100)],
        [],
        ['pre'],
      ),
      step(
        'Only now does the operation run',
        'The subtraction happens on inputs that are already proven sane. Assertions come first so the real work never sees an impossible value.',
        [6],
        [tok('call-a', 'next = 70', 'op'), balance(100)],
        [],
        ['op'],
      ),
      step(
        'Postcondition: check the result too',
        'After computing, the function verifies its own promise: the balance never becomes negative. It checks the outcome, not just the inputs, so a bug in the operation cannot slip out.',
        [7],
        [tok('call-a', '70 ≥ 0 ✓', 'post', OK), balance(100)],
        [],
        ['post'],
      ),
      step(
        'A proven value is persisted',
        'Only a value that passed every check leaves the function and gets written. The positive space works.',
        [8],
        [balance(70, OK)],
        [okLine],
        ['ledger', 'console'],
      ),
      step(
        'An overdraft the types accept',
        'withdraw(70, 130): both arguments are numbers, so TypeScript has no objection. This is the negative space: a state that must never happen.',
        [0],
        [tok('call-b', 'withdraw(70, 130)', 'input'), balance(70)],
        [okLine],
        ['input'],
      ),
      step(
        'Stopped loudly at the boundary',
        '130 is a positive integer, but 130 ≤ 70 is false. The assertion throws right here, with a stack trace next to the cause. The subtraction never runs and the balance is untouched.',
        [5],
        [tok('call-b', '130 ≤ 70 ✗', 'pre', ERROR), balance(70)],
        [okLine, stopped],
        ['pre', 'console'],
      ),
      step(
        'Now imagine the assertions deleted',
        'Same call, no guards. Nothing stops the bad input, so the operation runs and computes a balance that should be impossible.',
        [6],
        [tok('call-c', 'next = -60', 'op', ERROR), balance(70)],
        [okLine, stopped],
        ['op'],
      ),
      step(
        'The wrong value is returned and saved',
        'No exception, no log line, a successful response. A negative balance is now durable state, and nothing points back to the call that produced it.',
        [8],
        [balance(-60, ERROR)],
        [okLine, stopped, silent],
        ['ledger', 'console'],
      ),
      step(
        'Three steps later, far from the bug',
        'The value keeps flowing: it is printed on a statement, replicated, and backed up. When someone finally notices, the symptom is days and systems away from the cause.',
        [],
        [
          balance(-60, ERROR),
          tok('copy-1', 'statement: -60', 'downstream', ERROR),
          tok('copy-2', 'replica: -60', 'downstream', ERROR),
          tok('copy-3', 'backup: -60', 'downstream', ERROR),
        ],
        [okLine, stopped, silent, late],
        ['downstream', 'console'],
      ),
      step(
        'The postcondition is the second net',
        'Restore the assertions. Even if a precondition were missing or wrong, the check after the mutation catches -60 before it can be returned. A crash is visible and local; silent corruption is neither.',
        [7],
        [tok('call-d', '-60 ≥ 0 ✗', 'post', ERROR), balance(70, OK)],
        [okLine, stopped, silent, late, caught],
        ['post', 'ledger', 'console'],
      ),
    ],
  };
}

function decoratorsScene(): RuntimeScene {
  const entry = (label: string, extra: TokenExtra = {}) =>
    tok('entry', `'EUR' → ${label}`, 'cache', extra);
  const before = "→ fetchRate [ 'EUR' ]";
  const afterPending = '← fetchRate Promise { <pending> }';
  const afterCached = '← fetchRate Promise { 1.08 }';
  const first = [before, afterPending, '1.08'];
  return {
    code: {
      language: 'typescript',
      lines: [
        'class RatesClient {',
        '  @log',
        '  @memoize',
        '  @retry(3)',
        '  async fetchRate(currency: string): Promise<number> {',
        '    return requestRate(currency); // may reject with HTTP 503',
        '  }',
        '}',
        '',
        'const client = new RatesClient();',
        "console.log(await client.fetchRate('EUR'));",
        "console.log(await client.fetchRate('EUR'));",
      ],
    },
    regions: [
      region('caller', 'Caller', 'pipeline', 'yellow'),
      region('log', '@log', 'pipeline', 'teal'),
      region('memo', '@memoize', 'pipeline', 'orange'),
      region('retry', '@retry(3)', 'pipeline', 'teal'),
      region('method', 'fetchRate', 'pipeline', 'green'),
      region('cache', 'memoize cache (Map)', 'box', 'orange'),
      region('console', 'Console', 'console', 'red'),
    ],
    steps: [
      step(
        'Decorators wrap bottom-up',
        '@retry(3) is closest to the method, so it wraps first. @memoize wraps that, and @log ends up outermost. The method body is unchanged; callers now reach it through three layers of around advice.',
        range(1, 3),
        [],
        [],
        ['log', 'memo', 'retry'],
      ),
      step(
        'Call 1 enters the outermost layer',
        "The caller thinks it is calling fetchRate. It is really calling @log's replacement function, which prints its before advice and then proceeds inward.",
        [1],
        [tok('call-1', "fetchRate('EUR')", 'log')],
        [before],
        ['log', 'console'],
      ),
      step(
        '@memoize: a miss, so proceed',
        "The cache has no entry for 'EUR'. Around advice decides whether the call continues: on a miss it does.",
        [2],
        [tok('call-1', 'cache miss', 'memo')],
        [before],
        ['memo', 'cache'],
      ),
      step(
        '@retry starts attempt 1',
        'The retry layer opens its loop and calls the original method inside try/catch.',
        [3],
        [tok('call-1', 'attempt 1 of 3', 'retry')],
        [before],
        ['retry'],
      ),
      step(
        'The method body awaits the network',
        'Finally the business code runs. It starts the request and suspends at its first await.',
        range(4, 5),
        [tok('call-1', 'awaiting…', 'method', { progress: 0.4 })],
        [before],
        ['method'],
      ),
      step(
        'A pending promise unwinds first',
        "An async function returns a promise as soon as it suspends. That promise travels back out through the layers, and @memoize stores it under 'EUR' while the request is still running.",
        [2],
        [
          tok('promise-1', 'Promise ⟨pending⟩', 'memo', MUTED),
          tok('call-1', 'awaiting…', 'method', { progress: 0.6 }),
          entry('Promise ⟨pending⟩'),
        ],
        [before],
        ['memo', 'cache'],
      ),
      step(
        '@log sees a promise, not a number',
        "The after advice in @log is synchronous, so it prints the pending promise and returns it to the caller, who awaits. This is hidden control flow: the log line says 'done' before the work is done.",
        [1],
        [
          tok('promise-1', 'await ⟨pending⟩', 'caller', MUTED),
          tok('call-1', 'awaiting…', 'method', { progress: 0.8 }),
          entry('Promise ⟨pending⟩'),
        ],
        [before, afterPending],
        ['log', 'caller', 'console'],
      ),
      step(
        'Attempt 1 fails inside @retry',
        'The request rejects with HTTP 503. The catch block in @retry absorbs it and loops. Neither @log nor the caller ever learns that an attempt failed.',
        [3],
        [
          tok('promise-1', 'await ⟨pending⟩', 'caller', MUTED),
          tok('call-1', 'attempt 1: HTTP 503', 'retry', ERROR),
          entry('Promise ⟨pending⟩'),
        ],
        [before, afterPending],
        ['retry'],
      ),
      step(
        'Attempt 2 succeeds',
        'The method body runs a second time. That is only safe because reading a rate is idempotent; retrying a payment here could charge twice.',
        range(4, 5),
        [
          tok('promise-1', 'await ⟨pending⟩', 'caller', MUTED),
          tok('call-1', 'attempt 2: 1.08', 'method', OK),
          entry('Promise ⟨pending⟩'),
        ],
        [before, afterPending],
        ['method'],
      ),
      step(
        'The promise fulfills for the caller',
        'The same promise that was cached and logged now resolves to 1.08. The caller prints it. One call produced one log pair, two attempts, and one cache entry.',
        [10],
        [tok('promise-1', '1.08', 'caller', OK), entry('Promise ⟨1.08⟩', OK)],
        first,
        ['caller', 'cache', 'console'],
      ),
      step(
        'Call 2 stops at the cache',
        "The second call passes through @log, which prints its before line, and reaches @memoize. This time 'EUR' is in the map, so the advice does not proceed.",
        [2],
        [tok('call-2', 'cache hit', 'memo', OK), entry('Promise ⟨1.08⟩', OK)],
        [...first, before],
        ['memo', 'cache'],
      ),
      step(
        'The inner layers never run',
        '@retry and fetchRate did not execute at all, yet the caller cannot tell. Order is behavior: with @memoize below @retry the cache would sit inside the loop, and a promise that rejects after every attempt gets cached like any other.',
        [11],
        [tok('call-2', '1.08', 'caller', OK), entry('Promise ⟨1.08⟩', OK)],
        [...first, before, afterCached, '1.08'],
        ['caller', 'console'],
      ),
    ],
  };
}

function nestPipelineScene(): RuntimeScene {
  const timing = 'create took 3ms';
  const created = '201 { id, sku: "A-1", quantity: 2 }';
  const badRequest = '400 { statusCode: 400, path: "/orders", error }';
  const forbidden = '403 { statusCode: 403, path: "/orders", error }';
  return {
    code: {
      language: 'typescript',
      lines: [
        "@Controller('orders')",
        '@UseGuards(ApiKeyGuard)',
        '@UseInterceptors(TimingInterceptor)',
        '@UseFilters(HttpErrorFilter)',
        'export class OrdersController {',
        '  @Post()',
        '  create(@Body() dto: CreateOrderDto) {',
        '    return { id: randomUUID(), ...dto };',
        '  }',
        '}',
      ],
    },
    regions: [
      region('client', 'Client', 'pipeline', 'yellow'),
      region('middleware', 'Middleware', 'pipeline', 'teal'),
      region('guard', 'Guard', 'pipeline', 'orange'),
      region('interceptor', 'Interceptor', 'pipeline', 'teal'),
      region('pipe', 'Pipe', 'pipeline', 'orange'),
      region('handler', 'Handler', 'pipeline', 'green'),
      region('filter', 'Exception filter', 'box', 'red'),
      region('console', 'Responses and logs', 'console', 'yellow'),
    ],
    steps: [
      step(
        'A valid request leaves the client',
        'POST /orders with a correct x-api-key header and the body { sku: "A-1", quantity: 2 }. Follow it through every join point Nest puts in front of the handler.',
        [],
        [tok('req-1', 'POST /orders', 'client')],
        [],
        ['client'],
      ),
      step(
        'Middleware: the raw request',
        'RequestIdMiddleware is wired in AppModule.configure and runs first, before Nest knows which handler will be called. It can only see the raw request and response, so it stamps x-request-id and calls next().',
        [],
        [tok('req-1', '+ x-request-id', 'middleware')],
        [],
        ['middleware'],
      ),
      step(
        'Guard: may this request proceed?',
        'ApiKeyGuard answers one yes-or-no question. The header matches the expected key, so canActivate returns true and the request continues.',
        [1],
        [tok('req-1', 'api key ✓', 'guard', OK)],
        [],
        ['guard'],
      ),
      step(
        'Interceptor, before the handler',
        'TimingInterceptor is around advice. The code before next.handle() runs now and records the start time; the rest of it waits for the result to come back.',
        [2],
        [tok('req-1', 'timer started', 'interceptor')],
        [],
        ['interceptor'],
      ),
      step(
        'Pipe: validate and transform arguments',
        'ValidationPipe checks the body against CreateOrderDto and turns it into a real instance. The handler can only ever receive the shape the DTO declares.',
        [6],
        [tok('req-1', 'dto ✓', 'pipe', OK)],
        [],
        ['pipe'],
      ),
      step(
        'Handler: the one business line',
        'Identity, access, timing, and validation already happened elsewhere, so the controller method contains only the business decision.',
        range(6, 7),
        [tok('req-1', '{ id, sku, quantity }', 'handler')],
        [],
        ['handler'],
      ),
      step(
        'Interceptor, after the handler',
        'The result flows back through the same interceptor. Its tap operator observes the value and logs how long the handler took.',
        [2],
        [tok('req-1', 'tap: 3 ms', 'interceptor')],
        [timing],
        ['interceptor', 'console'],
      ),
      step(
        '201 Created reaches the client',
        'Nest serialises the return value and sends the response. No exception was thrown, so the filter was never involved.',
        [],
        [tok('req-1', '201 Created', 'client', OK)],
        [timing, created],
        ['client', 'console'],
      ),
      step(
        'Replay 1: an invalid body',
        'Now send { sku: "", quantity: 0 }. Middleware, guard, and the first half of the interceptor behave exactly as before. At the pipe, validation fails and it throws BadRequestException.',
        [6],
        [tok('req-2', 'quantity 0 ✗', 'pipe', ERROR)],
        [timing, created],
        ['pipe'],
      ),
      step(
        'The filter shapes the error',
        'The handler never ran. The error travels back through the interceptor stream, but tap only observes values, so nothing is timed. HttpErrorFilter catches the exception and writes one consistent body.',
        [3],
        [tok('req-2', '400 Bad Request', 'filter', ERROR)],
        [timing, created, badRequest],
        ['filter', 'console'],
      ),
      step(
        'Replay 2: no API key',
        'The guard returns false and Nest throws ForbiddenException. The request stops here: no interceptor, no pipe, no handler. The body is never even validated.',
        [1],
        [tok('req-3', 'api key ✗', 'guard', ERROR)],
        [timing, created, badRequest],
        ['guard'],
      ),
      step(
        'Same filter, same error shape',
        'A rejection from any stage ends in the same filter, so clients always get one error format. Each concern lives at its own join point in a known order, and the controller keeps one line.',
        [3],
        [tok('req-3', '403 Forbidden', 'filter', ERROR)],
        [timing, created, badRequest, forbidden],
        ['filter', 'console'],
      ),
    ],
  };
}

export const closuresRuntimeScene = withActions(closuresScene(), [
  ['createCounter: ƒ → global scope', 'swap'],
  ['createCounter() → scope #1 { count = 0 }', 'swap'],
  ['increment, current → keep scope #1', 'compare'],
  ['frame popped · scope #1 kept alive by a', 'ok'],
  ['createCounter(10) → scope #2 { count = 10 }', 'swap'],
  ['a → scope #1 · b → scope #2', 'compare'],
  ['++count → scope #1: 0 → 1', 'swap'],
  ['++count → scope #1: 1 → 2', 'swap'],
  ['a.current() = 2 · b.current() = 10', 'ok'],
  null,
]);
export const asyncRuntimeScene: RuntimeScene = {
  ...withActions(asyncScene(), [
    null,
    ['await loadUser(1) … 2 and 3 not started', 'compare'],
    ['user 1 ✓ @100 ms → start loadUser(2)', 'swap'],
    ['user 2 ✓ @200 ms → start loadUser(3)', 'swap'],
    ['100 + 100 + 100 = 300 ms', 'ok'],
    ['start 1, 2, 3 together → await once', 'swap'],
    ['max(100, 100, 100) = 100 ms', 'ok'],
    ['loadUser(2) ✗ HTTP 500 @40 ms → all rejects', 'error'],
    ['allSettled → [✓, ✗, ✓] @100 ms', 'ok'],
    ['await fetch(url, { signal }) … 99 ms', 'compare'],
    ['signal @100 ms → abort → TimeoutError', 'error'],
    null,
  ]),
  // Sequential awaits cost the sum; concurrent ones cost the slowest.
  complexity: { time: 'Σ tᵢ → max tᵢ', space: 'O(n)' },
};
export const narrowingRuntimeScene = withActions(narrowingScene(), [
  null,
  ['result: ok | error | loading', 'compare'],
  ["status === 'ok' ? → { status: 'ok'; data }", 'ok'],
  ["status === 'error' ? → { …; message }", 'ok'],
  ["status === 'loading' ? → last member", 'ok'],
  ['3 members − 3 cases = never', 'ok'],
  ["Result += { status: 'cancelled' }", 'swap'],
  ["'cancelled' → assertNever ✗ TS2345", 'error'],
  ['4 members − 4 cases = never', 'ok'],
  null,
]);
export const genericsRuntimeScene = withActions(genericsScene(), [
  ['getProperty<T = ?, K = ?>', 'compare'],
  ["getProperty(user, 'id') → infer T, K", 'compare'],
  ['T = { id: number; name: string }', 'ok'],
  ["keyof T = 'id' | 'name'", 'compare'],
  ["'id' extends keyof T ? → K = 'id'", 'ok'],
  ["T['id'] → number", 'ok'],
  ["K = 'name' → T['name'] → string", 'ok'],
  ["'email' extends keyof T ?", 'compare'],
  ["'email' ∉ 'id' | 'name' → TS2345", 'error'],
  null,
]);
export const negativeSpaceRuntimeScene = withActions(negativeSpaceScene(), [
  ['withdraw(balance = 100, amount = 30)', 'compare'],
  ['isInteger(30) && 30 > 0 ? → pass', 'ok'],
  ['30 <= 100 ? → pass', 'ok'],
  ['next = 100 - 30 = 70', 'swap'],
  ['70 >= 0 ? → pass', 'ok'],
  ['return 70 → balance = 70', 'ok'],
  ['withdraw(balance = 70, amount = 130)', 'compare'],
  ['130 <= 70 ? → false → throw', 'error'],
  ['no asserts: next = 70 - 130 = -60', 'error'],
  ['return -60 → balance = -60', 'error'],
  ['-60 → statement, replica, backup', 'error'],
  ['-60 >= 0 ? → false → throw', 'error'],
]);
export const decoratorsRuntimeScene = withActions(decoratorsScene(), [
  ['log(memoize(retry(fetchRate)))', 'compare'],
  ["@log before → fetchRate('EUR')", 'swap'],
  ["cache.has('EUR') ? → miss → proceed", 'compare'],
  ['@retry → attempt 1 of 3', 'swap'],
  ["await requestRate('EUR') …", 'compare'],
  ["cache.set('EUR', Promise ⟨pending⟩)", 'swap'],
  ['@log after → Promise ⟨pending⟩', 'compare'],
  ['attempt 1 → HTTP 503 → catch → retry', 'error'],
  ['attempt 2 → 1.08', 'ok'],
  ['await ⟨pending⟩ → 1.08', 'ok'],
  ["cache.has('EUR') ? → hit → return", 'ok'],
  ['@retry, fetchRate skipped → 1.08', 'ok'],
]);
export const nestPipelineRuntimeScene = withActions(nestPipelineScene(), [
  ['POST /orders { sku: "A-1", quantity: 2 }', 'compare'],
  ['middleware → req + x-request-id', 'swap'],
  ['guard.canActivate() → true', 'ok'],
  ['start = now() → next.handle()', 'swap'],
  ['pipe.transform(body) → CreateOrderDto ✓', 'ok'],
  ['create(dto) → { id, sku, quantity }', 'ok'],
  ["tap → 'create took 3ms'", 'ok'],
  ['return → 201 Created', 'ok'],
  ['pipe.transform({ quantity: 0 }) → throw 400', 'error'],
  ['filter.catch(400) → { statusCode: 400 }', 'error'],
  ['guard.canActivate() → false → 403', 'error'],
  ['filter.catch(403) → { statusCode: 403 }', 'error'],
]);
