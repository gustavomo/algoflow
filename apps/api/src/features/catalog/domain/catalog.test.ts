import { describe, expect, it } from 'vitest';
import {
  assessments,
  learningPaths,
  lessons,
  topics,
  tracks,
  validateCatalog,
} from './catalog';

describe('catalog', () => {
  it('contains the approved seed curriculum with valid references', () => {
    expect(tracks).toHaveLength(9);
    expect(topics).toHaveLength(12);
    expect(lessons).toHaveLength(14);
    expect(learningPaths).toHaveLength(25);
    expect(assessments).toHaveLength(14);
    expect(validateCatalog()).toEqual([]);
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
