import type {
  SystemDesignAttempt,
  SystemDesignDraft,
} from '@algoflow/contracts';
import type { SimulationRepository } from '../ports/simulationRepository';

interface State {
  drafts: Map<string, SystemDesignDraft>;
  attempts: SystemDesignAttempt[];
}
declare global {
  // eslint-disable-next-line no-var
  var __algoflowSimulationMemory: State | undefined;
}
function state(): State {
  return (globalThis.__algoflowSimulationMemory ??= {
    drafts: new Map(),
    attempts: [],
  });
}

export class MemorySimulationRepository implements SimulationRepository {
  async getDraft(scenarioSlug: string) {
    return state().drafts.get(scenarioSlug);
  }
  async saveDraft(draft: SystemDesignDraft) {
    state().drafts.set(draft.scenarioSlug, draft);
    return draft;
  }
  async listAttempts(scenarioSlug?: string) {
    return state()
      .attempts.filter(
        (attempt) => !scenarioSlug || attempt.scenarioSlug === scenarioSlug,
      )
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }
  async saveAttempt(attempt: SystemDesignAttempt) {
    state().attempts.push(attempt);
    return attempt;
  }
}
