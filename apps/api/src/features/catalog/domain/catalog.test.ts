import { describe, expect, it } from 'vitest';
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
    expect(scenes).toHaveLength(8);
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
