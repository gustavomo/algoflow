import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiError, sendApiError } from '../../lib/api/errors';
import { assertSameOrigin, requireString } from '../../lib/api/validate';
import { scheduleReview } from '../../lib/learning/scheduler';
import type { ReviewRating } from '../../lib/learning/types';
import { getLearningRepository } from '../../lib/persistence';

const RATINGS: ReviewRating[] = ['again', 'hard', 'good', 'easy'];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const repository = getLearningRepository();
    if (req.method === 'GET') {
      res
        .status(200)
        .json({ reviews: await repository.listDueReviews(new Date()) });
      return;
    }
    if (req.method !== 'POST')
      throw new ApiError(405, 'method_not_allowed', 'Use GET or POST.');
    assertSameOrigin(req);
    const conceptId = requireString(req.body?.conceptId, 'conceptId', 160);
    const rating = req.body?.rating as ReviewRating;
    if (!RATINGS.includes(rating))
      throw new ApiError(
        400,
        'invalid_rating',
        'Choose again, hard, good, or easy.',
      );
    const current = await repository.getReview(conceptId);
    if (!current)
      throw new ApiError(404, 'review_not_found', 'Review item not found.');
    const review = await repository.saveReview(scheduleReview(current, rating));
    res.status(200).json({ review });
  } catch (error) {
    sendApiError(res, error);
  }
}
