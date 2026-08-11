import type { NextApiRequest, NextApiResponse } from 'next';
import type { LessonStatus } from '@algoflow/contracts';
import { saveProgress } from '@api/features/progress/application/saveProgress';
import { ApiError } from '@api/platform/http/errors';
import { privateApi } from '@api/platform/http/handlers';
import { getLearningRepository } from '@api/platform/persistence';

const STATUSES: LessonStatus[] = ['not-started', 'in-progress', 'completed'];

export default privateApi(async (req: NextApiRequest, res: NextApiResponse) => {
  const repository = getLearningRepository();
  if (req.method === 'GET') {
    res.status(200).json(await repository.getSnapshot());
    return;
  }
  if (req.method !== 'POST')
    throw new ApiError(405, 'method_not_allowed', 'Use GET or POST.');
  const lessonSlug =
    typeof req.body?.lessonSlug === 'string' ? req.body.lessonSlug : '';
  const status = req.body?.status as LessonStatus;
  const percent = Number(req.body?.percent);
  if (!STATUSES.includes(status) || !Number.isFinite(percent)) {
    throw new ApiError(
      400,
      'invalid_progress',
      'A valid lesson, status, and percent are required.',
    );
  }
  const progress = await saveProgress(repository, {
    lessonSlug,
    status,
    percent,
  });
  if (!progress)
    throw new ApiError(400, 'invalid_progress', 'Lesson is not available.');
  res.status(200).json({ progress });
});
