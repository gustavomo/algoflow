import type { Chunk } from '../rag/types';

export interface AIRequest {
  question: string;
  tech?: string;
  context: Chunk[];
}

export interface AIClient {
  readonly provider: 'mock' | 'openai';
  ask(request: AIRequest): Promise<string>;
}

export async function getClient(): Promise<AIClient> {
  if (process.env.MOCK_AI === '1' || !process.env.OPENAI_API_KEY) {
    const { mockClient } = await import('./mockClient');
    return mockClient;
  }
  const { openaiClient } = await import('./openaiClient');
  return openaiClient;
}
