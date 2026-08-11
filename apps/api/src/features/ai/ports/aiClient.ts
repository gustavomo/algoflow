import type {
  AIEffort,
  AIProviderId,
  CurriculumDomain,
  RagChunk,
  Tech,
} from '@algoflow/contracts';

export interface AIRequest {
  question: string;
  tech?: Tech;
  domain?: CurriculumDomain;
  context: RagChunk[];
  signal?: AbortSignal;
}

export interface AIClient {
  readonly provider: AIProviderId;
  readonly model: string;
  readonly effort?: AIEffort;
  ask(request: AIRequest): Promise<string>;
}
