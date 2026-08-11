import type { AssessmentAttempt } from '@algoflow/contracts';

export interface AssessmentEvidence {
  conceptId: string;
  lessonSlug: string;
  correct: boolean;
}

export interface RecordedAssessment {
  attempt: AssessmentAttempt;
  evidence: AssessmentEvidence[];
}

export interface AssessmentRepository {
  recordAssessment(input: RecordedAssessment): Promise<AssessmentAttempt>;
}
