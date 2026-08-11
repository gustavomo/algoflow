import { describe, expect, it } from 'vitest';
import type { AssessmentDefinition } from '@algoflow/contracts';
import { assessmentBySlug } from '../../../catalog/domain/catalog';
import { gradeAssessment } from '../gradeAssessment';

describe('gradeAssessment', () => {
  it('grades stored answers without AI judgement', () => {
    const assessment = assessmentBySlug.get('bubble-sort-checkpoint')!;
    const grade = gradeAssessment(assessment, {
      'bubble-sort-js-recall': 'A sorted suffix at the right boundary',
      'bubble-sort-js-application': 'Compare 3 and 1, then swap them',
      'bubble-sort-js-debugging':
        'The swapped flag is not reset before each pass',
      'bubble-sort-js-teach-back': [
        'Compare adjacent values',
        'Swap only inversions',
        'Shrink the unsorted boundary after a pass',
      ],
      'bubble-sort-js-transfer': 'The first pass performs no swaps',
    });
    expect(grade.score).toBe(100);
    expect(grade.passed).toBe(true);
    expect(grade.gatesPassed).toBe(true);
    expect(grade.failedConceptIds).toEqual([]);
  });

  it('does not pass a high score when a critical transfer gate fails', () => {
    const assessment = assessmentBySlug.get('bubble-sort-checkpoint')!;
    const answers = Object.fromEntries(
      assessment.questions.map((question) => {
        if (question.kind === 'multiple-select')
          return [question.id, question.correctAnswer];
        if (question.kind === 'multiple-choice')
          return [
            question.id,
            question.intent === 'interview'
              ? question.options.find(
                  (option) => option !== question.correctAnswer,
                )!
              : question.correctAnswer,
          ];
        return [question.id, ''];
      }),
    );
    const grade = gradeAssessment(assessment, answers);
    expect(grade.score).toBe(80);
    expect(grade.scorePassed).toBe(true);
    expect(grade.missingRequiredIntents).toEqual(['interview']);
    expect(grade.passed).toBe(false);
  });

  it('grades aliases, numeric ranges, and unordered canonical sets deterministically', () => {
    const bfs = assessmentBySlug.get('bfs-grid-checkpoint')!;
    expect(
      gradeAssessment(bfs, {
        'bfs-grid-go-recall': ' fifo QUEUE ',
      }).results.find((result) => result.questionId === 'bfs-grid-go-recall')
        ?.correct,
    ).toBe(true);

    const complexity = assessmentBySlug.get('complexity-basics-checkpoint')!;
    expect(
      gradeAssessment(complexity, {
        'complexity-basics-js-application': '10000',
      }).results.find(
        (result) => result.questionId === 'complexity-basics-js-application',
      )?.correct,
    ).toBe(true);

    const bubble = assessmentBySlug.get('bubble-sort-checkpoint')!;
    expect(
      gradeAssessment(bubble, {
        'bubble-sort-js-teach-back': [
          'Shrink the unsorted boundary after a pass',
          'Compare adjacent values',
          'Swap only inversions',
        ],
      }).results.find(
        (result) => result.questionId === 'bubble-sort-js-teach-back',
      )?.correct,
    ).toBe(true);
  });

  it('rejects partial orderings, duplicate selections, and out-of-range numbers', () => {
    const assessment: AssessmentDefinition = {
      slug: 'answer-kind-boundaries',
      title: 'Answer kind boundaries',
      passingScore: 100,
      questions: [
        {
          id: 'ordering',
          kind: 'ordering',
          prompt: 'Order the stages.',
          options: ['observe', 'decide', 'act'],
          correctAnswer: ['observe', 'decide', 'act'],
          explanation: 'Evidence precedes action.',
          conceptIds: ['reasoning-loop'],
        },
        {
          id: 'selection',
          kind: 'multiple-select',
          prompt: 'Select the safeguards.',
          options: ['timeout', 'retry', 'guess'],
          correctAnswer: ['timeout', 'retry'],
          explanation: 'Both safeguards are required.',
          conceptIds: ['reliability'],
        },
        {
          id: 'number',
          kind: 'numeric-range',
          prompt: 'Choose a value between 10 and 20.',
          min: 10,
          max: 20,
          explanation: 'The accepted interval is inclusive.',
          conceptIds: ['estimation'],
        },
      ],
    };

    const grade = gradeAssessment(assessment, {
      ordering: ['observe', 'decide'],
      selection: ['timeout', 'timeout'],
      number: '21',
    });
    expect(grade.correctCount).toBe(0);
    expect(grade.failedConceptIds).toEqual([
      'reasoning-loop',
      'reliability',
      'estimation',
    ]);
  });

  it('records a perfect diagnostic without granting mastery completion', () => {
    const diagnostic = assessmentBySlug.get('system-design-diagnostic')!;
    const answers = Object.fromEntries(
      diagnostic.questions.map((question) => {
        if (question.kind === 'multiple-select')
          return [question.id, question.correctAnswer];
        if (question.kind === 'ordering')
          return [question.id, question.correctAnswer];
        if (question.kind === 'short-answer')
          return [question.id, question.acceptedAnswers[0]];
        if (question.kind === 'numeric-range')
          return [question.id, String(question.min)];
        return [question.id, question.correctAnswer];
      }),
    );
    const grade = gradeAssessment(diagnostic, answers);
    expect(grade.score).toBe(100);
    expect(grade.scorePassed).toBe(true);
    expect(grade.diagnostic).toBe(true);
    expect(grade.passed).toBe(false);
  });
});
