import type {
  AssessmentDefinition,
  AssessmentQuestion,
} from '../content/types';

export interface GradedQuestion {
  questionId: string;
  correct: boolean;
  explanation: string;
  conceptIds: string[];
}

export interface AssessmentGrade {
  score: number;
  correctCount: number;
  totalCount: number;
  passed: boolean;
  failedConceptIds: string[];
  results: GradedQuestion[];
}

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase().replaceAll(/\s+/g, '');
}

function isCorrect(
  question: AssessmentQuestion,
  answer: string | string[] | undefined,
) {
  if (question.kind === 'ordering') {
    return (
      Array.isArray(answer) &&
      answer.length === question.correctAnswer.length &&
      answer.every((value, index) => value === question.correctAnswer[index])
    );
  }
  return (
    typeof answer === 'string' &&
    normalizeText(answer) === normalizeText(question.correctAnswer)
  );
}

export function gradeAssessment(
  assessment: AssessmentDefinition,
  answers: Record<string, string | string[]>,
): AssessmentGrade {
  const results = assessment.questions.map((question) => ({
    questionId: question.id,
    correct: isCorrect(question, answers[question.id]),
    explanation: question.explanation,
    conceptIds: question.conceptIds,
  }));
  const correctCount = results.filter((result) => result.correct).length;
  const score = Math.round((correctCount / results.length) * 100);
  const failedConceptIds = Array.from(
    new Set(
      results
        .filter((result) => !result.correct)
        .flatMap((result) => result.conceptIds),
    ),
  );
  return {
    score,
    correctCount,
    totalCount: results.length,
    passed: score >= assessment.passingScore,
    failedConceptIds,
    results,
  };
}

export function masteryDelta(correct: boolean) {
  return correct ? 0.18 : -0.22;
}
