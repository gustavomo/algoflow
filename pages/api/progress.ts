import type { NextApiRequest, NextApiResponse } from 'next';
import { lessonBySlug } from '../../lib/content/catalog';
import { ApiError, sendApiError } from '../../lib/api/errors';
import { assertSameOrigin } from '../../lib/api/validate';
import type { LessonStatus } from '../../lib/learning/types';
import { getLearningRepository } from '../../lib/persistence';

const STATUSES: LessonStatus[] = ['not-started', 'in-progress', 'completed'];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const repository = getLearningRepository();
    if (req.method === 'GET') {
      res.status(200).json(await repository.getSnapshot());
      return;
    }
    if (req.method !== 'POST')
      throw new ApiError(405, 'method_not_allowed', 'Use GET or POST.');
    assertSameOrigin(req);
    const lessonSlug =
      typeof req.body?.lessonSlug === 'string' ? req.body.lessonSlug : '';
    const status = req.body?.status as LessonStatus;
    const percent = Number(req.body?.percent);
    if (
      !lessonBySlug.has(lessonSlug) ||
      !STATUSES.includes(status) ||
      !Number.isFinite(percent)
    ) {
      throw new ApiError(
        400,
        'invalid_progress',
        'A valid lesson, status, and percent are required.',
      );
    }
    const now = new Date().toISOString();
    const saved = await repository.saveLessonProgress({
      lessonSlug,
      status,
      percent: Math.min(100, Math.max(0, Math.round(percent))),
      startedAt: status === 'not-started' ? undefined : now,
      completedAt: status === 'completed' ? now : undefined,
      updatedAt: now,
    });
    res.status(200).json({ progress: saved });
  } catch (error) {
    sendApiError(res, error);
  }
}
