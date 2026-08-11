import type {
  TutorHelpLevel,
  TutorOverlay,
  TutorSceneContext,
} from '@algoflow/contracts';

export interface TutorProviderRequest {
  question: string;
  helpLevel: TutorHelpLevel;
  context: TutorSceneContext;
  groundedContext: string;
}

export interface TutorProviderOutput {
  message: string;
  followUpQuestion?: string;
  overlay?: TutorOverlay;
}

export interface TutorClient {
  readonly provider: 'mock' | 'openai';
  tutor(request: TutorProviderRequest): Promise<TutorProviderOutput>;
}
