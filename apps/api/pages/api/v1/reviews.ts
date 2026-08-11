import type { NextApiRequest, NextApiResponse } from 'next';
import type { ReviewRating } from '@algoflow/contracts';
import {
  listDueReviews,
  rateReview,
} from '@api/features/review/application/reviewUseCases';
import { ApiError } from '@api/platform/http/errors';
import { privateApi } from '@api/platform/http/handlers';
import { requireString } from '@api/platform/http/validate';
import { getLearningRepository } from '@api/platform/persistence';

const RATINGS: ReviewRating[] = ['again', 'hard', 'good', 'easy'];

export default privateApi(async (req: NextApiRequest, res: NextApiResponse) => {
  const repository = getLearningRepository();
  if (req.method === 'GET') {
    res.status(200).json({ reviews: await listDueReviews(repository) });
    return;
  }
  if (req.method !== 'POST')
    throw new ApiError(405, 'method_not_allowed', 'Use GET or POST.');
  const conceptId = requireString(req.body?.conceptId, 'conceptId', 160);
  const rating = req.body?.rating as ReviewRating;
  if (!RATINGS.includes(rating))
    throw new ApiError(
      400,
      'invalid_rating',
      'Choose again, hard, good, or easy.',
    );
  const review = await rateReview(repository, conceptId, rating);
  if (!review)
    throw new ApiError(404, 'review_not_found', 'Review item not found.');
  res.status(200).json({ review });
});
