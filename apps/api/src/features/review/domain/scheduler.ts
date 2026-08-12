import type { ReviewRating, ReviewState } from '@algoflow/contracts';

const DAY_MS = 86_400_000;
const MIN_EASE = 1.3;
const MAX_EASE = 3;

export function createReviewState(
  conceptId: string,
  lessonSlug?: string,
  now = new Date(),
): ReviewState {
  return {
    conceptId,
    lessonSlug,
    intervalDays: 1,
    easeFactor: 2.5,
    repetitions: 0,
    lapses: 0,
    dueAt: new Date(now.getTime() + DAY_MS).toISOString(),
  };
}

export function scheduleReview(
  current: ReviewState,
  rating: ReviewRating,
  now = new Date(),
): ReviewState {
  let intervalDays = current.intervalDays;
  let easeFactor = current.easeFactor;
  let repetitions = current.repetitions;
  let lapses = current.lapses;

  if (rating === 'again') {
    intervalDays = 1;
    repetitions = 0;
    lapses += 1;
    easeFactor -= 0.2;
  } else if (rating === 'hard') {
    intervalDays = Math.max(1, Math.round(intervalDays * 1.2));
    repetitions += 1;
    easeFactor -= 0.15;
  } else if (rating === 'good') {
    repetitions += 1;
    intervalDays =
      repetitions === 1
        ? 1
        : repetitions === 2
          ? 3
          : Math.round(intervalDays * easeFactor);
  } else {
    repetitions += 1;
    intervalDays =
      repetitions === 1 ? 3 : Math.round(intervalDays * (easeFactor + 0.3));
    easeFactor += 0.15;
  }

  easeFactor = Math.min(
    MAX_EASE,
    Math.max(MIN_EASE, Number(easeFactor.toFixed(2))),
  );
  intervalDays = Math.max(1, intervalDays);
  return {
    ...current,
    intervalDays,
    easeFactor,
    repetitions,
    lapses,
    lastReviewedAt: now.toISOString(),
    dueAt: new Date(now.getTime() + intervalDays * DAY_MS).toISOString(),
  };
}
