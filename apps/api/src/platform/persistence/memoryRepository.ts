import type {
  AssessmentAttempt,
  LearningSnapshot,
  LessonProgress,
  NotificationPreferences,
  PushSubscriptionRecord,
  ReviewState,
} from '@algoflow/contracts';
import { createReviewState } from '../../features/review/domain/scheduler';
import type { LearningRepository, RecordedAssessment } from './types';

interface MemoryState {
  progress: Map<string, LessonProgress>;
  attempts: AssessmentAttempt[];
  reviews: Map<string, ReviewState>;
  preferences: NotificationPreferences;
  subscriptions: Map<string, PushSubscriptionRecord>;
  deliveries: Set<string>;
  focusedPathSlug?: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __algoflowMemoryState: MemoryState | undefined;
}

function getState(): MemoryState {
  if (!globalThis.__algoflowMemoryState) {
    globalThis.__algoflowMemoryState = {
      progress: new Map(),
      attempts: [],
      reviews: new Map(),
      preferences: {
        enabled: false,
        timezone: process.env.REMINDER_TIMEZONE || 'America/Bogota',
        updatedAt: new Date().toISOString(),
      },
      subscriptions: new Map(),
      deliveries: new Set(),
    };
  }
  return globalThis.__algoflowMemoryState;
}

export class MemoryLearningRepository implements LearningRepository {
  async getSnapshot(): Promise<LearningSnapshot> {
    const state = getState();
    return {
      progress: Array.from(state.progress.values()),
      attempts: [...state.attempts],
      reviews: Array.from(state.reviews.values()),
      notificationPreferences: state.preferences,
      focusedPathSlug: state.focusedPathSlug,
    };
  }

  async getFocusedPath() {
    return getState().focusedPathSlug;
  }

  async setFocusedPath(pathSlug?: string) {
    getState().focusedPathSlug = pathSlug;
    return pathSlug;
  }

  async saveLessonProgress(progress: LessonProgress) {
    getState().progress.set(progress.lessonSlug, progress);
    return progress;
  }

  async recordAssessment(input: RecordedAssessment) {
    const state = getState();
    state.attempts.push(input.attempt);
    const existingProgress = state.progress.get(input.attempt.lessonSlug);
    state.progress.set(input.attempt.lessonSlug, {
      lessonSlug: input.attempt.lessonSlug,
      status: 'completed',
      percent: 100,
      startedAt: existingProgress?.startedAt ?? input.attempt.createdAt,
      completedAt: input.attempt.createdAt,
      updatedAt: input.attempt.createdAt,
    });
    for (const evidence of input.evidence) {
      const current = state.reviews.get(evidence.conceptId);
      const dueAt = new Date(
        new Date(input.attempt.createdAt).getTime() +
          (evidence.correct ? 3 : 1) * 86_400_000,
      ).toISOString();
      if (!current) {
        const review = createReviewState(
          evidence.conceptId,
          evidence.lessonSlug,
          new Date(input.attempt.createdAt),
        );
        review.dueAt = dueAt;
        review.lapses = evidence.correct ? 0 : 1;
        state.reviews.set(evidence.conceptId, review);
      } else if (!evidence.correct) {
        state.reviews.set(evidence.conceptId, {
          ...current,
          repetitions: 0,
          lapses: current.lapses + 1,
          dueAt,
        });
      } else if (current.dueAt > dueAt) {
        state.reviews.set(evidence.conceptId, { ...current, dueAt });
      }
    }
    return input.attempt;
  }

  async getReview(conceptId: string) {
    return getState().reviews.get(conceptId);
  }

  async saveReview(review: ReviewState) {
    getState().reviews.set(review.conceptId, review);
    return review;
  }

  async listDueReviews(now: Date) {
    return Array.from(getState().reviews.values())
      .filter((review) => new Date(review.dueAt) <= now)
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  }

  async saveNotificationPreferences(preferences: NotificationPreferences) {
    getState().preferences = preferences;
    return preferences;
  }

  async savePushSubscription(subscription: PushSubscriptionRecord) {
    getState().subscriptions.set(subscription.endpoint, subscription);
  }

  async removePushSubscription(endpoint: string) {
    getState().subscriptions.delete(endpoint);
  }

  async listActivePushSubscriptions() {
    return Array.from(getState().subscriptions.values());
  }

  async claimNotificationDelivery(endpoint: string, dedupeKey: string) {
    const key = `${endpoint}:${dedupeKey}`;
    if (getState().deliveries.has(key)) return false;
    getState().deliveries.add(key);
    return true;
  }

  async releaseNotificationDelivery(endpoint: string, dedupeKey: string) {
    getState().deliveries.delete(`${endpoint}:${dedupeKey}`);
  }

  async deactivatePushSubscription(endpoint: string) {
    getState().subscriptions.delete(endpoint);
  }
}
