import type { ScenarioDraftGenerationRequest } from '@algoflow/contracts';

export interface ScenarioAuthoringProvider {
  readonly provider: 'mock' | 'openai';
  generate(request: ScenarioDraftGenerationRequest): Promise<unknown>;
}
