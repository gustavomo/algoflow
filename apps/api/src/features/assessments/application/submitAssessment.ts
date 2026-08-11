import { randomUUID } from 'node:crypto';
import { assessmentBySlug } from '../../catalog/domain/catalog';
import type { AssessmentRepository } from '../ports/assessmentRepository';
import { gradeAssessment } from '../domain/gradeAssessment';

export interface SubmitAssessmentInput {
  assessmentSlug: string;
  answers: Record<string, string | string[]>;
  durationSeconds: number;
}

export async function submitAssessment(
  repository: AssessmentRepository,
  input: SubmitAssessmentInput,
) {
  const assessment = assessmentBySlug.get(input.assessmentSlug);
  if (!assessment) return undefined;
  const grade = gradeAssessment(assessment, input.answers);
  const createdAt = new Date().toISOString();
  const sourceSlug =
    assessment.lessonSlug ?? assessment.scope?.slug ?? assessment.slug;
  const updatesLessonProgress =
    (assessment.scope?.kind === 'lesson' || !assessment.scope) && grade.passed;
  const attempt = {
    id: randomUUID(),
    assessmentSlug: input.assessmentSlug,
    lessonSlug: sourceSlug,
    assessmentVersion: assessment.version,
    scope: assessment.scope,
    score: grade.score,
    correctCount: grade.correctCount,
    totalCount: grade.totalCount,
    answers: input.answers,
    failedConceptIds: grade.failedConceptIds,
    missingRequiredIntents: grade.missingRequiredIntents,
    durationSeconds: input.durationSeconds,
    createdAt,
  };
  await repository.recordAssessment({
    attempt,
    updatesLessonProgress,
    updatesMastery: assessment.mode !== 'diagnostic',
    evidence: grade.results.flatMap((result) =>
      result.conceptIds.map((conceptId) => ({
        conceptId,
        lessonSlug: assessment.lessonSlug,
        sourceType: 'checkpoint' as const,
        sourceId: assessment.slug,
        title: assessment.title,
        prompt: `${result.intent} evidence for ${conceptId.replaceAll('-', ' ')}`,
        answer: result.explanation,
        correct: result.correct,
      })),
    ),
  });
  return { attempt, grade };
}
