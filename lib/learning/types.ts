export type LessonStatus = 'not-started' | 'in-progress' | 'completed';
export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface LessonProgress {
  lessonSlug: string;
  status: LessonStatus;
  percent: number;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
}

export interface AssessmentAttempt {
  id: string;
  assessmentSlug: string;
  lessonSlug: string;
  score: number;
  correctCount: number;
  totalCount: number;
  answers: Record<string, string | string[]>;
  failedConceptIds: string[];
  durationSeconds: number;
  createdAt: string;
}

export interface ReviewState {
  conceptId: string;
  lessonSlug: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  lapses: number;
  dueAt: string;
  lastReviewedAt?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  timezone: string;
  updatedAt: string;
}

export interface PushSubscriptionRecord {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface LearningSnapshot {
  progress: LessonProgress[];
  attempts: AssessmentAttempt[];
  reviews: ReviewState[];
  notificationPreferences: NotificationPreferences;
}
