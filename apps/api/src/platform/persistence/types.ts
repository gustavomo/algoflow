import type {
  AssessmentRepository,
  RecordedAssessment,
} from '../../features/assessments/ports/assessmentRepository';
import type { NotificationRepository } from '../../features/notifications/ports/notificationRepository';
import type { ProgressRepository } from '../../features/progress/ports/progressRepository';
import type { ReviewRepository } from '../../features/review/ports/reviewRepository';

export type { RecordedAssessment };

export interface LearningRepository
  extends ProgressRepository,
    AssessmentRepository,
    ReviewRepository,
    NotificationRepository {}
