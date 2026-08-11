import type { NextApiRequest, NextApiResponse } from 'next';
import { assessmentBySlug } from '@api/features/catalog/domain/catalog';
import { submitAssessment } from '@api/features/assessments/application/submitAssessment';
import { ApiError } from '@api/platform/http/errors';
import { privateApi } from '@api/platform/http/handlers';
import {
  clampedInteger,
  requireMethod,
  requireString,
} from '@api/platform/http/validate';
import { getLearningRepository } from '@api/platform/persistence';

export default privateApi(async (req: NextApiRequest, res: NextApiResponse) => {
  requireMethod(req, 'POST');
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
  const result = await submitAssessment(getLearningRepository(), {
    assessmentSlug,
    answers,
    durationSeconds: clampedInteger(req.body?.durationSeconds, 0, 0, 86_400),
  });
  res.status(200).json(result);
});
