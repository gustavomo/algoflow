import { randomUUID } from 'node:crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { assessmentBySlug } from '../../lib/content/catalog';
import { ApiError, sendApiError } from '../../lib/api/errors';
import {
  assertSameOrigin,
  clampedInteger,
  requireMethod,
  requireString,
} from '../../lib/api/validate';
import { gradeAssessment } from '../../lib/learning/assessment';
import { getLearningRepository } from '../../lib/persistence';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    requireMethod(req, 'POST');
    assertSameOrigin(req);
    const assessmentSlug = requireString(
      req.body?.assessmentSlug,
      'assessmentSlug',
      160,
    );
    const assessment = assessmentBySlug.get(assessmentSlug);
    if (!assessment)
      throw new ApiError(404, 'assessment_not_found', 'Assessment not found.');
    const answers = req.body?.answers;
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      throw new ApiError(400, 'invalid_answers', 'answers must be an object.');
    }
    for (const question of assessment.questions) {
      const answer = answers[question.id];
      const valid =
        question.kind === 'ordering'
          ? Array.isArray(answer)
          : typeof answer === 'string' && answer.trim();
      if (!valid)
        throw new ApiError(
          400,
          'incomplete_assessment',
          'Answer every question before submitting.',
        );
    }

    const grade = gradeAssessment(assessment, answers);
    const createdAt = new Date().toISOString();
    const attempt = {
      id: randomUUID(),
      assessmentSlug,
      lessonSlug: assessment.lessonSlug,
      score: grade.score,
      correctCount: grade.correctCount,
      totalCount: grade.totalCount,
      answers,
      failedConceptIds: grade.failedConceptIds,
      durationSeconds: clampedInteger(req.body?.durationSeconds, 0, 0, 86_400),
      createdAt,
    };
    await getLearningRepository().recordAssessment({
      attempt,
      evidence: grade.results.flatMap((result) =>
        result.conceptIds.map((conceptId) => ({
          conceptId,
          lessonSlug: assessment.lessonSlug,
          correct: result.correct,
        })),
      ),
    });
    res.status(200).json({ attempt, grade });
  } catch (error) {
    sendApiError(res, error);
  }
}
