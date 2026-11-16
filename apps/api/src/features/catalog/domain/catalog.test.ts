import { describe, expect, it } from 'vitest';
import {
  assessments,
  learningPaths,
  lessons,
  topics,
  tracks,
  validateCatalog,
  validateLearningPathResources,
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
    expect(conceptLessons).toHaveLength(18);
    expect(
      new Set(conceptLessons.map((lesson) => lesson.conceptFlow?.scene)).size,
    ).toBe(11);
    for (const lesson of conceptLessons) {
      const steps = lesson.conceptFlow!.steps;
      expect(steps[0].phase).toBe('initial');
      expect(steps.some((step) => step.phase === 'failure')).toBe(true);
      expect(steps.some((step) => step.phase === 'recovery')).toBe(true);
      expect(steps.at(-1)?.phase).toBe('terminal');
      expect(lesson.conceptFlow?.terminalSummary).toBeTruthy();
    }
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
