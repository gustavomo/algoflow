import type { CurriculumDomain, RagChunk, Tech } from '@algoflow/contracts';

export interface AIRequest {
  question: string;
  tech?: Tech;
  domain?: CurriculumDomain;
  context: RagChunk[];
}

export interface AIClient {
  readonly provider: 'mock' | 'openai';
  ask(request: AIRequest): Promise<string>;
}
