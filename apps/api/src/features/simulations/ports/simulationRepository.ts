import type {
  SystemDesignAttempt,
  SystemDesignDraft,
} from '@algoflow/contracts';

export interface SimulationRepository {
  getDraft(scenarioSlug: string): Promise<SystemDesignDraft | undefined>;
  saveDraft(draft: SystemDesignDraft): Promise<SystemDesignDraft>;
  listAttempts(scenarioSlug?: string): Promise<SystemDesignAttempt[]>;
  saveAttempt(attempt: SystemDesignAttempt): Promise<SystemDesignAttempt>;
}
