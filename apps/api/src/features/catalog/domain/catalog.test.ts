import { describe, expect, it } from 'vitest';
import {
  RUNTIME_SCENE_MAX_GENERATED_STEPS,
  RUNTIME_SCENE_MAX_STEPS,
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
    expect(conceptLessons).toHaveLength(10);
    expect(
      new Set(conceptLessons.map((lesson) => lesson.conceptFlow?.scene)).size,
    ).toBe(10);
    for (const lesson of conceptLessons) {
      const steps = lesson.conceptFlow!.steps;
      expect(steps[0].phase).toBe('initial');
      expect(steps.some((step) => step.phase === 'failure')).toBe(true);
      expect(steps.some((step) => step.phase === 'recovery')).toBe(true);
      expect(steps.at(-1)?.phase).toBe('terminal');
      expect(lesson.conceptFlow?.terminalSummary).toBeTruthy();
    }
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
    // 8 hand-written runtime scenes plus the 5 generated algorithm scenes.
    expect(scenes).toHaveLength(13);
    expect(
      lessons.filter((item) => item.visualization === 'runtime-scene'),
    ).toHaveLength(12);
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
