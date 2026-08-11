import type {
  LearningScenarioDraft,
  ScenarioDraftGenerationRequest,
} from '@algoflow/contracts';
import {
  evaluateScenarioDraft,
  parseLearningScenarioDraft,
} from '../domain/scenarioDraft';
import type { ScenarioAuthoringProvider } from '../ports/scenarioAuthoringProvider';

export async function generateScenarioDraft(
  provider: ScenarioAuthoringProvider,
  request: ScenarioDraftGenerationRequest,
) {
  const generated = await provider.generate(request);
  const parsed = parseLearningScenarioDraft(generated);
  if (!parsed.value)
    return { error: parsed.error ?? 'The generated draft is invalid.' };
  return {
    value: {
      draft: parsed.value,
      report: evaluateScenarioDraft(parsed.value),
      provider: provider.provider,
    },
  };
}

export function validateScenarioDraft(draft: unknown) {
  const parsed = parseLearningScenarioDraft(draft);
  if (!parsed.value) return { error: parsed.error ?? 'Draft is invalid.' };
  return {
    value: {
      draft: parsed.value as LearningScenarioDraft,
      report: evaluateScenarioDraft(parsed.value),
    },
  };
}
