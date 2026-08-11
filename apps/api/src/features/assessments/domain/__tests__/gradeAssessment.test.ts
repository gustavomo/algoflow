import { describe, expect, it } from 'vitest';
import { assessmentBySlug } from '../../../catalog/domain/catalog';
import { gradeAssessment } from '../gradeAssessment';

describe('gradeAssessment', () => {
  it('grades stored answers without AI judgement', () => {
    const assessment = assessmentBySlug.get('bubble-sort-checkpoint')!;
    const grade = gradeAssessment(assessment, {
      'bubble-action': 'Swaps the pair',
      'bubble-order': ['Compare', 'Swap', 'Settle'],
    });
    expect(grade.score).toBe(100);
    expect(grade.failedConceptIds).toEqual([]);
  });
});
