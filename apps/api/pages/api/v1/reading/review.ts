import type { NextApiRequest, NextApiResponse } from 'next';
import { convertNoteToReview } from '@api/features/reading/application/readingUseCases';
import { ApiError } from '@api/platform/http/errors';
import { privateApi } from '@api/platform/http/handlers';
import { requireMethod, requireString } from '@api/platform/http/validate';
import {
  getLearningRepository,
  getReadingRepository,
} from '@api/platform/persistence';

export default privateApi(async (req: NextApiRequest, res: NextApiResponse) => {
  requireMethod(req, 'POST');
  const noteId = requireString(req.body?.noteId, 'noteId', 80);
  const result = await convertNoteToReview(
    getReadingRepository(),
    getLearningRepository(),
    noteId,
    req.body ?? {},
  );
  if ('missing' in result)
    throw new ApiError(404, 'note_not_found', 'Note not found.');
  if (!result.value)
    throw new ApiError(
      400,
      'invalid_review_prompt',
      result.error ?? 'Review prompt is invalid.',
    );
  res.status(200).json({ review: result.value });
});
