import type { ReviewRating } from '@algoflow/contracts';
import { scheduleReview } from '../domain/scheduler';
import type { ReviewRepository } from '../ports/reviewRepository';

export function listDueReviews(repository: ReviewRepository, now = new Date()) {
  return repository.listDueReviews(now);
}

export async function rateReview(
  repository: ReviewRepository,
  conceptId: string,
  rating: ReviewRating,
) {
  const current = await repository.getReview(conceptId);
  if (!current) return undefined;
  return repository.saveReview(scheduleReview(current, rating));
}
