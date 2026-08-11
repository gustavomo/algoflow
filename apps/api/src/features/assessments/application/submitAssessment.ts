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
  const attempt = {
    id: randomUUID(),
    assessmentSlug: input.assessmentSlug,
    lessonSlug: assessment.lessonSlug,
    score: grade.score,
    correctCount: grade.correctCount,
    totalCount: grade.totalCount,
    answers: input.answers,
    failedConceptIds: grade.failedConceptIds,
    durationSeconds: input.durationSeconds,
    createdAt,
  };
  await repository.recordAssessment({
    attempt,
    evidence: grade.results.flatMap((result) =>
      result.conceptIds.map((conceptId) => ({
        conceptId,
        lessonSlug: assessment.lessonSlug,
        correct: result.correct,
      })),
    ),
  });
  return { attempt, grade };
}
