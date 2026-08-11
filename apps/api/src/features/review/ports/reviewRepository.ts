import type { ReviewState } from '@algoflow/contracts';

export interface ReviewRepository {
  getReview(conceptId: string): Promise<ReviewState | undefined>;
  saveReview(review: ReviewState): Promise<ReviewState>;
  listDueReviews(now: Date): Promise<ReviewState[]>;
}
