import { describe, expect, it } from 'vitest';
import {
  RUNTIME_SCENE_MAX_GENERATED_STEPS,
  RUNTIME_SCENE_MAX_STEPS,
  RUNTIME_SCENE_PLOT_MAX_POINTS,
  RUNTIME_SCENE_TABLE_MAX_ROWS,
} from '@algoflow/contracts';
import {
  assessments,
  learningPaths,
  lessons,
  topics,
  tracks,
  validateCatalog,
  validateLearningPathResources,
  validateRuntimeScene,
} from './catalog';

import { VECTOR_DOCS, VECTOR_QUERY, cosine, dot } from './conceptScenes';

const scene = (slug: string) =>
  lessons.find((item) => item.slug === slug)!.runtimeScene!;

describe('catalog', () => {
  it('contains the approved seed curriculum with valid references', () => {
    expect(tracks).toHaveLength(10);
    expect(topics).toHaveLength(16);
    expect(lessons).toHaveLength(24);
    expect(learningPaths).toHaveLength(28);
    expect(assessments).toHaveLength(68);
    expect(
      assessments.filter((assessment) => assessment.scope?.kind === 'lesson'),
    ).toHaveLength(24);
    expect(
      assessments.filter((assessment) => assessment.scope?.kind === 'topic'),
    ).toHaveLength(16);
    expect(
      assessments.filter((assessment) => assessment.scope?.kind === 'path'),
    ).toHaveLength(28);
    expect(validateCatalog()).toEqual([]);
  });

  it('gives every path a deep curriculum and optional primary resources', () => {
    for (const path of learningPaths) {
      expect(path.modules.length).toBeGreaterThanOrEqual(5);
      expect(path.modules.length).toBeLessThanOrEqual(7);
      const resources = path.modules.flatMap(
        (module) => module.resources ?? [],
      );
      expect(resources.length).toBeGreaterThanOrEqual(2);
      expect(
        resources.every((resource) => resource.url.startsWith('https://')),
      ).toBe(true);
    }
  });

  it('gives each concept lesson a complete dedicated visual narrative', () => {
    const conceptLessons = lessons.filter(
      (lesson) => lesson.visualization === 'concept-flow',
    );
    expect(conceptLessons).toHaveLength(5);
    expect(
      new Set(conceptLessons.map((lesson) => lesson.conceptFlow?.scene)).size,
    ).toBe(5);
    for (const lesson of conceptLessons) {
      const steps = lesson.conceptFlow!.steps;
      expect(steps[0].phase).toBe('initial');
      expect(steps.some((step) => step.phase === 'failure')).toBe(true);
      expect(steps.some((step) => step.phase === 'recovery')).toBe(true);
      expect(steps.at(-1)?.phase).toBe('terminal');
      expect(lesson.conceptFlow?.terminalSummary).toBeTruthy();
      const flow = lesson.conceptFlow!;
      const nodeIds = flow.nodes.map((node) => node.id);
      expect(steps.length).toBeGreaterThanOrEqual(7);
      expect(flow.nodes.every((node) => node.detail)).toBe(true);
      // Every node is visited by the travelling token at least once.
      expect(new Set(steps.map((step) => step.token?.nodeId))).toEqual(
        new Set(nodeIds),
      );
      for (const step of steps) {
        // Narration is written for the lesson, never generated from labels.
        expect(step.narration.length).toBeGreaterThan(120);
        expect(step.narration).not.toMatch(
          /joins the model|establishes the first boundary/,
        );
        expect(step.token?.label).toBeTruthy();
      }
      expect(new Set(steps.map((step) => step.narration)).size).toBe(
        steps.length,
      );
      expect(new Set(steps.map((step) => step.token!.label)).size).toBe(
        steps.length,
      );
      const failure = steps.find((step) => step.phase === 'failure')!;
      expect(failure.failedNodeIds).toEqual([failure.token!.nodeId]);
      expect(failure.token!.tone).toBe('error');
      expect(steps.at(-1)!.completedNodeIds).toEqual(nodeIds);
      expect(steps.at(-1)!.activeConnectionIndexes).toHaveLength(
        flow.connections.length,
      );
    }
  });

  it('rejects concept flows that point at unknown nodes', () => {
    const lesson = lessons.find(
      (item) => item.slug === 'software-systems-map',
    )!;
    const original = lesson.conceptFlow!;
    const broken = structuredClone(original);
    broken.steps[0].token!.nodeId = 'node-9';
    broken.steps[1].token!.label = ' ';
    broken.steps[2].activeConnectionIndexes = [9];
    broken.steps[3].narration = '';
    broken.connections[0].to = 'nowhere';
    lesson.conceptFlow = broken;
    try {
      const errors = validateCatalog().join(' | ');
      expect(errors).toMatch(/concept step 1 unknown node node-9/);
      expect(errors).toMatch(/concept step 2 empty token label/);
      expect(errors).toMatch(/concept step 3 connection 9 out of range/);
      expect(errors).toMatch(/concept step 4 needs a label and a narration/);
      expect(errors).toMatch(/concept connection to unknown node/);
    } finally {
      lesson.conceptFlow = original;
    }
    expect(validateCatalog()).toEqual([]);
  });

  it('drives the JavaScript execution model with a valid runtime scene', () => {
    const lesson = lessons.find(
      (item) => item.slug === 'javascript-execution-model',
    );
    expect(lesson?.visualization).toBe('runtime-scene');
    const scene = lesson!.runtimeScene!;
    expect(scene.steps.length).toBeGreaterThanOrEqual(9);
    expect(scene.steps.length).toBeLessThanOrEqual(11);
    expect(scene.steps.at(-1)?.output).toEqual([
      'Start',
      'End',
      'Promise',
      'Timeout',
    ]);
    expect(validateRuntimeScene(lesson!.slug, scene)).toEqual([]);
  });

  it('rejects runtime scenes with bad lines, duplicate tokens, or unknown regions', () => {
    const scene = structuredClone(
      lessons.find((item) => item.slug === 'javascript-execution-model')!
        .runtimeScene!,
    );
    scene.steps[0].codeLines = [scene.code.lines.length];
    scene.steps[1].tokens.push({ ...scene.steps[1].tokens[0] });
    scene.steps[2].tokens[0].regionId = 'heap';
    scene.steps[3].activeRegionIds = ['nowhere'];

    const errors = validateRuntimeScene('demo', scene).join(' ');
    expect(errors).toMatch(/runtime step 1 code line 4 out of range/);
    expect(errors).toMatch(/runtime step 2 duplicate token script/);
    expect(errors).toMatch(/runtime step 3 unknown region heap/);
    expect(errors).toMatch(/runtime step 4 unknown region nowhere/);
  });

  it('rejects invalid action captions and complexity chips', () => {
    const scene = structuredClone(
      lessons.find((item) => item.slug === 'javascript-execution-model')!
        .runtimeScene!,
    );
    scene.steps[0].action = { text: '  ' };
    scene.steps[1].action = { text: 'x'.repeat(65) };
    scene.steps[2].action = { text: 'a > b ?', tone: 'loud' as never };
    scene.steps[3].action = undefined;
    scene.complexity = { time: 'O(n)', space: '' };

    const errors = validateRuntimeScene('demo', scene).join(' ');
    expect(errors).toMatch(/runtime step 1 empty action caption/);
    expect(errors).toMatch(/runtime step 2 action caption too long/);
    expect(errors).toMatch(/runtime step 3 unknown action tone loud/);
    expect(errors).not.toMatch(/runtime step 4/);
    expect(errors).toMatch(/runtime complexity needs time and space/);
  });

  it('captions the live operation in every runtime scene', () => {
    const scenes = lessons.flatMap((item) =>
      item.runtimeScene ? [item.runtimeScene] : [],
    );
    // 8 hand-written runtime scenes, 5 concept scenes and the 5 generated
    // algorithm scenes.
    expect(scenes).toHaveLength(18);
    expect(
      lessons.filter((item) => item.visualization === 'runtime-scene'),
    ).toHaveLength(17);
    for (const scene of scenes) {
      const captioned = scene.steps.filter((step) => step.action);
      expect(captioned.length).toBeGreaterThanOrEqual(scene.steps.length - 3);
      for (const step of captioned) expect(step.action!.tone).toBeTruthy();
    }
    expect(
      lessons.find((item) => item.slug === 'javascript-async-patterns')
        ?.runtimeScene?.complexity,
    ).toEqual({ time: expect.any(String), space: 'O(n)' });
  });

  it('rejects runtime tokens with unknown links or invalid progress', () => {
    const scene = structuredClone(
      lessons.find((item) => item.slug === 'javascript-closures-scope')!
        .runtimeScene!,
    );
    scene.steps[0].tokens[0].linkRegionId = 'scope-9';
    scene.steps[1].tokens[0].progress = 1.5;
    scene.steps[2].tokens[0].progress = Number.NaN;

    const errors = validateRuntimeScene('demo', scene).join(' ');
    expect(errors).toMatch(/runtime step 1 unknown region scope-9/);
    expect(errors).toMatch(/runtime step 2 token script progress out of range/);
    expect(errors).toMatch(/runtime step 3 token script progress out of range/);
  });

  it.each([
    ['javascript-closures-scope', ['2 10']],
    [
      'javascript-async-patterns',
      [
        'sequential: 300 ms',
        'Promise.all: 100 ms',
        'Promise.all rejected at 40 ms: HTTP 500',
        'allSettled: fulfilled, rejected, fulfilled',
        'TimeoutError at 100 ms: request cancelled',
      ],
    ],
    [
      'typescript-types-narrowing',
      [
        '✓ default: result is never',
        "✗ TS2345: '{ status: \"cancelled\" }' is not assignable to 'never'",
        "✓ case 'cancelled' added: result is never again",
      ],
    ],
    [
      'typescript-generics',
      [
        'const id: number',
        'const name: string',
        'TS2345: \'"email"\' is not assignable to parameter of type \'"id" | "name"\'',
      ],
    ],
    [
      'negative-space-assertions',
      [
        'withdraw(100, 30) → 70',
        'Error: Assertion failed: withdrawal never exceeds balance',
        'withdraw(70, 130) → -60 (no assertions, no error)',
        'days later: reconciliation mismatch, cause unknown',
        'Error: Assertion failed: balance never becomes negative',
      ],
    ],
    [
      'aspect-oriented-decorators',
      [
        "→ fetchRate [ 'EUR' ]",
        '← fetchRate Promise { <pending> }',
        '1.08',
        "→ fetchRate [ 'EUR' ]",
        '← fetchRate Promise { 1.08 }',
        '1.08',
      ],
    ],
    [
      'nestjs-request-pipeline',
      [
        'create took 3ms',
        '201 { id, sku: "A-1", quantity: 2 }',
        '400 { statusCode: 400, path: "/orders", error }',
        '403 { statusCode: 403, path: "/orders", error }',
      ],
    ],
  ])('authors a sound runtime scene for %s', (slug, finalOutput) => {
    const lesson = lessons.find((item) => item.slug === slug)!;
    expect(lesson.visualization).toBe('runtime-scene');
    expect(lesson.conceptFlow).toBeUndefined();
    const scene = lesson.runtimeScene!;
    expect(validateRuntimeScene(slug, scene)).toEqual([]);
    expect(scene.steps.length).toBeGreaterThanOrEqual(8);
    expect(scene.steps.length).toBeLessThanOrEqual(12);
    expect(scene.steps.at(-1)?.output).toEqual(finalOutput);
    expect(
      scene.regions.filter((region) => region.kind === 'console'),
    ).toHaveLength(1);
    const usedRegions = new Set(
      scene.steps.flatMap((step) => step.tokens.map((token) => token.regionId)),
    );
    for (const region of scene.regions)
      if (region.kind !== 'console')
        expect(usedRegions.has(region.id), region.id).toBe(true);
    scene.steps.forEach((step, index) => {
      expect(step.label).toBeTruthy();
      expect(step.narration.length).toBeGreaterThan(60);
      // The highlight band spans min..max, so lines must be contiguous.
      const sorted = [...step.codeLines].sort((a, b) => a - b);
      expect(sorted.at(-1)! - sorted[0] + 1 || 0).toBe(sorted.length);
      // Output only ever grows: the console never rewrites history.
      if (index > 0)
        expect(
          step.output.slice(0, scene.steps[index - 1].output.length),
        ).toEqual(scene.steps[index - 1].output);
    });
  });

  it.each([
    [
      'request-to-cdn',
      'pipeline',
      [
        'MISS         /app.css  182 ms',
        'HIT          /app.css   14 ms',
        'REVALIDATED  /app.css   96 ms',
      ],
    ],
    [
      'containers-and-images',
      'stack',
      [
        'built shop:1 · 4 layers',
        'removed a: config.json edit and cat.png are gone',
        'built shop:2 · 3 layers cached, 1 rebuilt',
      ],
    ],
    [
      'prompt-to-agent-loop',
      'pipeline',
      ['Refund r_77 for order #1042 is pending: about 3 days.'],
    ],
    [
      'relational-data-modeling',
      'table',
      [
        'ERROR  orders.customer_id = 9 has no row in customers',
        'ERROR  customers.id = 2 is still referenced by orders',
        '101 | ana@work.io | 40',
        '102 | ana@work.io | 15',
        '103 | bo@x.io     | 25',
      ],
    ],
    ['vectors-for-machine-learning', 'plot', ['top = ["kitten", "cat"]']],
  ])(
    'migrates %s to a runtime scene built on %s',
    (slug, kind, finalOutput) => {
      const lesson = lessons.find((item) => item.slug === slug)!;
      expect(lesson.visualization).toBe('runtime-scene');
      expect(lesson.conceptFlow).toBeUndefined();
      const scene = lesson.runtimeScene!;
      expect(validateRuntimeScene(slug, scene)).toEqual([]);
      expect(scene.steps.length).toBeGreaterThanOrEqual(8);
      expect(scene.steps.length).toBeLessThanOrEqual(12);
      expect(scene.regions.some((region) => region.kind === kind)).toBe(true);
      expect(scene.code.lines.length).toBeGreaterThan(0);
      expect(scene.steps.at(-1)?.output).toEqual(finalOutput);
      expect(scene.steps.every((step) => step.action)).toBe(true);
      scene.steps.forEach((step, index) => {
        expect(step.label).toBeTruthy();
        expect(step.narration.length).toBeGreaterThan(120);
        const sorted = [...step.codeLines].sort((a, b) => a - b);
        expect(sorted.at(-1)! - sorted[0] + 1 || 0).toBe(sorted.length);
        if (index > 0)
          expect(
            step.output.slice(0, scene.steps[index - 1].output.length),
          ).toEqual(scene.steps[index - 1].output);
      });
    },
  );

  it('shows a cache miss before the hit that it makes possible', () => {
    const steps = scene('request-to-cdn').steps;
    const first = (text: string) =>
      steps.findIndex((step) => step.action?.text.includes(text));
    expect(first('MISS')).toBeGreaterThan(-1);
    expect(first('HIT')).toBeGreaterThan(first('MISS'));
    // The entry stored on the miss is the one the hit reads.
    const stored = steps.findIndex((step) =>
      step.tokens.some((token) => token.regionId === 'cache'),
    );
    expect(stored).toBeGreaterThan(first('MISS'));
    expect(stored).toBeLessThan(first('HIT'));
  });

  it('fills the agent context window on every turn', () => {
    const used = scene('prompt-to-agent-loop').steps.map(
      (step) => step.tokens.find((token) => token.id === 'ctx')!.progress!,
    );
    expect(used[0]).toBeGreaterThan(0);
    used.forEach((value, index) => {
      if (index > 0) expect(value).toBeGreaterThanOrEqual(used[index - 1]);
    });
    expect(used.at(-1)).toBeGreaterThan(used[0]);
  });

  it('normalises the wide table and rejects the orphan order', () => {
    const steps = scene('relational-data-modeling').steps;
    const shown = steps.map((step) =>
      (step.tables ?? []).map((view) => view.regionId).join('+'),
    );
    expect(shown[0]).toBe('flat');
    expect(shown.at(-1)).toBe('customers+orders');
    const orphan = steps.findIndex((step) =>
      step.tables?.some((view) =>
        view.rows.some((row) => row.link?.rowId === 'c9'),
      ),
    );
    expect(orphan).toBeGreaterThan(0);
    expect(steps[orphan + 1].output.join(' ')).toMatch(/customer_id = 9/);
    expect(steps[orphan + 1].tables!.flatMap((view) => view.rows).length).toBe(
      5,
    );
  });

  it('computes the vector scores it shows', () => {
    const query = VECTOR_QUERY;
    const byName = new Map(VECTOR_DOCS);
    // The teaching failure: the dot product ranks the longer vector higher.
    expect(dot(query, byName.get('car')!)).toBeGreaterThan(
      dot(query, byName.get('kitten')!),
    );
    expect(cosine(query, byName.get('kitten')!)).toBeGreaterThan(
      cosine(query, byName.get('car')!),
    );
    const last = scene('vectors-for-machine-learning').steps.at(-1)!;
    const view = last.plots![0];
    expect(view.neighbours).toEqual(['kitten', 'cat']);
    // Normalised vectors sit on the unit arc.
    for (const point of view.points)
      expect(Math.hypot(point.x, point.y)).toBeCloseTo(1, 6);
    expect(last.tokens.map((token) => token.label)).toEqual(
      [...byName.keys()]
        .sort(
          (a, b) =>
            cosine(query, byName.get(b)!) - cosine(query, byName.get(a)!),
        )
        .map(
          (name) => `${name} ${cosine(query, byName.get(name)!).toFixed(2)}`,
        ),
    );
  });

  it('rejects malformed table views', () => {
    const broken = structuredClone(scene('relational-data-modeling'));
    const orders = (index: number) =>
      broken.steps[index].tables!.find((view) => view.regionId === 'orders')!;
    broken.steps[0].tables![0].columns = [];
    broken.steps[1].tables![0].rows[0].cells.pop();
    broken.steps[2].tables![0].rows[1].id =
      broken.steps[2].tables![0].rows[0].id;
    orders(3).rows[0].state = 'glowing' as never;
    orders(4).rows[0].focus = [7];
    orders(5).rows[0].link = { regionId: 'orders', rowId: 'o102' };
    orders(6).rows[0].link = { regionId: 'console', rowId: 'x' };
    broken.steps[7].tables![0].regionId = 'console';
    broken.steps[8].tables!.push(structuredClone(broken.steps[8].tables![0]));
    broken.steps[9].tokens.push({
      id: 'stray',
      label: 'x',
      regionId: 'orders',
    });
    const rows = orders(10).rows;
    while (rows.length <= RUNTIME_SCENE_TABLE_MAX_ROWS)
      rows.push({ ...rows[0], id: `extra-${rows.length}` });

    const errors = validateRuntimeScene('demo', broken).join(' | ');
    expect(errors).toMatch(/step 1 table flat needs 1 to 5 labelled columns/);
    expect(errors).toMatch(/step 2 table flat row f101 expects 3 cells, has 2/);
    expect(errors).toMatch(/step 3 table flat duplicate row f101/);
    expect(errors).toMatch(/step 4 table orders unknown row state glowing/);
    expect(errors).toMatch(/step 5 table orders row o101 focus out of range/);
    expect(errors).toMatch(/step 6 table orders row o101 must link to another/);
    expect(errors).toMatch(/step 7 table orders row o101 must link to another/);
    expect(errors).toMatch(/step 8 table console is not a table region/);
    expect(errors).toMatch(/step 9 duplicate view of region customers/);
    expect(errors).toMatch(/step 10 token stray cannot sit in table orders/);
    expect(errors).toMatch(/step 11 table orders has 9 rows, limit is 8/);
  });

  it('accepts an orphan row and a table that does not exist yet', () => {
    const sound = scene('relational-data-modeling');
    // The wide table is dropped and the orphan points at a missing row.
    expect(
      sound.steps[5].tables!.some((view) => view.regionId === 'flat'),
    ).toBe(false);
    expect(validateRuntimeScene('demo', sound)).toEqual([]);
  });

  it('rejects an event loop that checks while the stack is busy', () => {
    const broken = structuredClone(scene('javascript-execution-model'));
    const busy = broken.steps.findIndex((step) =>
      step.tokens.some((token) => token.regionId === 'call-stack'),
    );
    broken.steps[busy].eventLoop = 'checking';
    expect(validateRuntimeScene('demo', broken)).toEqual([
      `demo: runtime step ${busy + 1} event loop cannot check while the stack is busy`,
    ]);
  });

  it('rejects malformed plot views', () => {
    const broken = structuredClone(scene('vectors-for-machine-learning'));
    const view = (index: number) => broken.steps[index].plots![0];
    view(0).points[0].x = 1.2;
    view(1).points[1].id = view(1).points[0].id;
    view(2).query!.y = -0.1;
    view(3).neighbours = ['kitten', 'kitten', 'tiger'];
    view(4).angle = { pointId: 'tiger', label: ' ' };
    delete view(5).query;
    broken.steps[6].plots = [];
    view(7).points[0].state = 'glowing' as never;
    view(8).points[0].label = '';
    const points = view(9).points;
    while (points.length <= RUNTIME_SCENE_PLOT_MAX_POINTS)
      points.push({ ...points[0], id: `extra-${points.length}` });
    view(9).axes = { x: 'x', y: '' };

    const errors = validateRuntimeScene('demo', broken).join(' | ');
    expect(errors).toMatch(/step 1 plot space point cat out of range/);
    expect(errors).toMatch(/step 2 plot space duplicate point kitten/);
    expect(errors).toMatch(/step 3 plot space query needs a label and coord/);
    expect(errors).toMatch(/step 4 plot space duplicate neighbour kitten/);
    expect(errors).toMatch(/step 4 plot space unknown neighbour tiger/);
    expect(errors).toMatch(/step 5 plot space angle to unknown point tiger/);
    expect(errors).toMatch(/step 5 plot space angle needs a label/);
    expect(errors).toMatch(
      /step 6 plot space neighbours and angle need a query/,
    );
    expect(errors).toMatch(/step 7 missing plot view space/);
    expect(errors).toMatch(/step 8 plot space unknown point state glowing/);
    expect(errors).toMatch(/step 9 plot space unlabelled point kitten/);
    expect(errors).toMatch(/step 10 plot space has 13 points, limit is 12/);
    expect(errors).toMatch(/step 10 plot space axes need two labels/);
  });

  it('allows long traces only for scenes with array or grid regions', () => {
    const authored = structuredClone(scene('javascript-execution-model'));
    while (authored.steps.length <= RUNTIME_SCENE_MAX_STEPS)
      authored.steps.push(structuredClone(authored.steps[0]));
    expect(validateRuntimeScene('demo', authored).join(' ')).toMatch(
      /runtime scene has 13 steps, limit is 12/,
    );

    const generated = structuredClone(scene('bubble-sort-js'));
    expect(generated.steps.length).toBeGreaterThan(RUNTIME_SCENE_MAX_STEPS);
    expect(validateRuntimeScene('demo', generated)).toEqual([]);
    while (generated.steps.length <= RUNTIME_SCENE_MAX_GENERATED_STEPS)
      generated.steps.push(structuredClone(generated.steps[0]));
    expect(validateRuntimeScene('demo', generated).join(' ')).toMatch(
      /runtime scene has 81 steps, limit is 80/,
    );
  });

  it('rejects malformed array views', () => {
    const broken = structuredClone(scene('two-pointers-js'));
    const view = (index: number) => broken.steps[index].arrays![0];
    view(0).pointers![0].index = 99;
    view(1).range = { from: 4, to: 2 };
    view(2).cells[0].state = 'glowing' as never;
    view(3).cells[1].id = view(3).cells[0].id;
    view(4).cells[0].id = 'intruder';
    view(5).cells[0].weight = 2;
    broken.steps[6].arrays = [];
    broken.steps[7].tokens.push({ id: 'stray', label: 'x', regionId: 'a' });

    const errors = validateRuntimeScene('demo', broken).join(' | ');
    expect(errors).toMatch(/step 1 array a pointer L out of range/);
    expect(errors).toMatch(/step 2 array a range out of bounds/);
    expect(errors).toMatch(/step 3 array a unknown cell state glowing/);
    expect(errors).toMatch(/step 4 array a duplicate cell v0/);
    expect(errors).toMatch(/step 5 array a cell ids changed between steps/);
    expect(errors).toMatch(/step 6 array a cell v0 weight out of range/);
    expect(errors).toMatch(/step 7 missing array view a/);
    expect(errors).toMatch(/step 8 token stray cannot sit in array a/);
  });

  it('rejects malformed grid layouts, views, paths and cell tokens', () => {
    const broken = structuredClone(scene('bfs-grid-go'));
    const wall = broken.regions[0].grid!.walls[0];
    broken.steps[0].grids![0].cells.pop();
    broken.steps[1].grids![0].cells[wall] = 'visited';
    broken.steps[2].grids![0].cells[0] = 'lava' as never;
    broken.steps[3].tokens[0].cell = { regionId: 'grid', index: wall };
    broken.steps[4].grids = [];
    broken.steps[5].grids![0].path = [0, 2, 35];
    broken.steps[6].tokens.push({ id: 'lost', label: '?', regionId: 'grid' });
    broken.steps[7].grids![0].regionId = 'frontier';

    const errors = validateRuntimeScene('demo', broken).join(' | ');
    expect(errors).toMatch(/step 1 grid grid expects 36 cells, has 35/);
    expect(errors).toMatch(/step 2 grid grid wall 8 cannot have a state/);
    expect(errors).toMatch(/step 3 grid grid unknown cell state lava/);
    expect(errors).toMatch(/step 4 token c\d+ points at an invalid grid cell/);
    expect(errors).toMatch(/step 5 missing grid view grid/);
    expect(errors).toMatch(/step 6 grid grid path must walk open cells/);
    expect(errors).toMatch(/step 7 token lost needs a cell in grid grid/);
    expect(errors).toMatch(/step 8 grid frontier is not a grid region/);

    const layout = structuredClone(scene('bfs-grid-go'));
    layout.regions[0].grid!.goal = layout.regions[0].grid!.walls[0];
    layout.regions[0].grid!.walls.push(99);
    layout.regions[1].grid = structuredClone(layout.regions[0].grid);
    const layoutErrors = validateRuntimeScene('demo', layout).join(' | ');
    expect(layoutErrors).toMatch(/region grid wall out of range/);
    expect(layoutErrors).toMatch(/region grid goal must be an open cell/);
    expect(layoutErrors).toMatch(/region frontier is not a grid but has/);
    delete layout.regions[0].grid;
    expect(validateRuntimeScene('demo', layout).join(' | ')).toMatch(
      /region grid needs a grid layout/,
    );
  });

  it('rejects malformed predict-first challenges', () => {
    const broken = structuredClone(scene('bubble-sort-js'));
    const asked = broken.steps.flatMap((step, index) =>
      step.challenge ? [index] : [],
    );
    broken.steps[asked[0]].challenge!.answer = 2;
    broken.steps[asked[1]].challenge!.options = ['Only one'];
    broken.steps[asked[2]].challenge!.options = ['Same', 'Same'];
    broken.steps[asked[3]].challenge!.prompt = ' ';
    broken.steps.at(-1)!.challenge = structuredClone(
      broken.steps[asked[4]].challenge,
    );

    const errors = validateRuntimeScene('demo', broken).join(' | ');
    expect(errors).toMatch(
      new RegExp(`step ${asked[0] + 1} challenge answer out of range`),
    );
    expect(errors).toMatch(
      new RegExp(`step ${asked[1] + 1} challenge needs 2 to 4 options`),
    );
    expect(errors).toMatch(
      new RegExp(`step ${asked[2] + 1} challenge options must be distinct`),
    );
    expect(errors).toMatch(
      new RegExp(`step ${asked[3] + 1} challenge needs a prompt`),
    );
    expect(errors).toMatch(
      new RegExp(`step ${broken.steps.length} final step cannot ask`),
    );
  });

  it('rejects malformed, insecure, and duplicate resource metadata', () => {
    const path = structuredClone(learningPaths[0]);
    const resources = path.modules.flatMap((module) => module.resources ?? []);
    resources[0].id = 'Invalid Resource ID';
    resources[0].url = 'http://example.com/insecure';
    resources[0].kind = 'social-post' as never;
    resources[1].id = resources[0].id;

    expect(validateLearningPathResources(path).join(' ')).toMatch(
      /duplicate resource/i,
    );
    expect(validateLearningPathResources(path).join(' ')).toMatch(
      /invalid resource identifier/i,
    );
    expect(validateLearningPathResources(path).join(' ')).toMatch(
      /invalid resource url/i,
    );
    expect(validateLearningPathResources(path).join(' ')).toMatch(
      /invalid resource invalid resource id/i,
    );
  });

  it('keeps planned modules out of available lesson progress', () => {
    const systemDesign = learningPaths.find(
      (path) => path.slug === 'system-design',
    );
    expect(systemDesign?.lessonSlugs).toEqual([]);
    expect(
      systemDesign?.modules.every(
        (pathModule) => pathModule.status !== 'available',
      ),
    ).toBe(true);
  });
});
