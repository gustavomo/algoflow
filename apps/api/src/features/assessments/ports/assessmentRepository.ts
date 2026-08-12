import type { AssessmentAttempt } from '@algoflow/contracts';

export interface AssessmentEvidence {
  conceptId: string;
  lessonSlug?: string;
  sourceType?: 'checkpoint';
  sourceId?: string;
  title?: string;
  prompt?: string;
  answer?: string;
  correct: boolean;
}

export interface RecordedAssessment {
  attempt: AssessmentAttempt;
  evidence: AssessmentEvidence[];
  updatesLessonProgress?: boolean;
  updatesMastery?: boolean;
}

export interface AssessmentRepository {
  recordAssessment(input: RecordedAssessment): Promise<AssessmentAttempt>;
}
