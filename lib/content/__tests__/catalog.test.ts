import { describe, expect, it } from 'vitest';
import {
  assessments,
  learningPaths,
  lessons,
  topics,
  validateCatalog,
} from '../catalog';

describe('catalog', () => {
  it('contains the approved seed curriculum with valid references', () => {
    expect(topics).toHaveLength(4);
    expect(lessons).toHaveLength(6);
    expect(learningPaths).toHaveLength(3);
    expect(assessments).toHaveLength(6);
    expect(validateCatalog()).toEqual([]);
  });
});
