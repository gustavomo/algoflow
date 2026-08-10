import type {
  AssessmentAttempt,
  LearningSnapshot,
  LessonProgress,
  NotificationPreferences,
  PushSubscriptionRecord,
  ReviewState,
} from '../learning/types';

export interface AssessmentEvidence {
  conceptId: string;
  lessonSlug: string;
  correct: boolean;
}

export interface RecordedAssessment {
  attempt: AssessmentAttempt;
  evidence: AssessmentEvidence[];
}

export interface LearningRepository {
  getSnapshot(): Promise<LearningSnapshot>;
  saveLessonProgress(progress: LessonProgress): Promise<LessonProgress>;
  recordAssessment(input: RecordedAssessment): Promise<AssessmentAttempt>;
  getReview(conceptId: string): Promise<ReviewState | undefined>;
  saveReview(review: ReviewState): Promise<ReviewState>;
  listDueReviews(now: Date): Promise<ReviewState[]>;
  saveNotificationPreferences(
    preferences: NotificationPreferences,
  ): Promise<NotificationPreferences>;
  savePushSubscription(subscription: PushSubscriptionRecord): Promise<void>;
  removePushSubscription(endpoint: string): Promise<void>;
  listActivePushSubscriptions(): Promise<PushSubscriptionRecord[]>;
  claimNotificationDelivery(
    endpoint: string,
    dedupeKey: string,
  ): Promise<boolean>;
  releaseNotificationDelivery(
    endpoint: string,
    dedupeKey: string,
  ): Promise<void>;
  deactivatePushSubscription(endpoint: string): Promise<void>;
}
