import {
  ASSESSMENT_INTENTS,
  type AssessmentDefinition,
  type AssessmentGrade,
  type AssessmentIntent,
  type AssessmentQuestion,
} from '@algoflow/contracts';

function normalizeText(value: string) {
  return value
    .normalize('NFKD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '');
}

function sameSet(answer: string[], expected: string[]) {
  const actual = new Set(answer);
  return (
    actual.size === answer.length &&
    actual.size === expected.length &&
    expected.every((value) => actual.has(value))
  );
}

function isCorrect(
  question: AssessmentQuestion,
  answer: string | string[] | undefined,
) {
  if (question.kind === 'ordering')
    return (
      Array.isArray(answer) &&
      answer.length === question.correctAnswer.length &&
      answer.every((value, index) => value === question.correctAnswer[index])
    );
  if (question.kind === 'multiple-select')
    return Array.isArray(answer) && sameSet(answer, question.correctAnswer);
  if (question.kind === 'short-answer')
    return (
      typeof answer === 'string' &&
      question.acceptedAnswers.some(
        (accepted) => normalizeText(answer) === normalizeText(accepted),
      )
    );
  if (question.kind === 'numeric-range') {
    if (typeof answer !== 'string' || !answer.trim()) return false;
    const numeric = Number(answer);
    return (
      Number.isFinite(numeric) &&
      numeric >= question.min &&
      numeric <= question.max
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
    intent: question.intent ?? ('recall' as const),
    weight: question.weight ?? 1,
  }));
  const correctCount = results.filter((result) => result.correct).length;
  const availableWeight = results.reduce(
    (sum, result) => sum + result.weight,
    0,
  );
  const earnedWeight = results
    .filter((result) => result.correct)
    .reduce((sum, result) => sum + result.weight, 0);
  const score = availableWeight
    ? Math.round((earnedWeight / availableWeight) * 100)
    : 0;
  const requiredIntents = assessment.requiredIntents ?? [];
  const missingRequiredIntents = requiredIntents.filter(
    (intent) =>
      !results.some((result) => result.intent === intent && result.correct),
  );
  const intentEvidence = ASSESSMENT_INTENTS.flatMap((intent) => {
    const matching = results.filter((result) => result.intent === intent);
    if (!matching.length) return [];
    return [
      {
        intent: intent as AssessmentIntent,
        earned: matching
          .filter((result) => result.correct)
          .reduce((sum, result) => sum + result.weight, 0),
        available: matching.reduce((sum, result) => sum + result.weight, 0),
        correctCount: matching.filter((result) => result.correct).length,
        totalCount: matching.length,
      },
    ];
  });
  const failedConceptIds = Array.from(
    new Set(
      results
        .filter((result) => !result.correct)
        .flatMap((result) => result.conceptIds),
    ),
  );
  const scorePassed = score >= assessment.passingScore;
  const gatesPassed = missingRequiredIntents.length === 0;
  const diagnostic = assessment.mode === 'diagnostic';
  return {
    score,
    correctCount,
    totalCount: results.length,
    passed: scorePassed && gatesPassed && !diagnostic,
    scorePassed,
    gatesPassed,
    diagnostic,
    missingRequiredIntents,
    intentEvidence,
    failedConceptIds,
    results,
  };
}

export function masteryDelta(correct: boolean) {
  return correct ? 0.18 : -0.22;
}
