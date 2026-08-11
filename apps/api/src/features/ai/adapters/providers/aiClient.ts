import type { AIClient } from '../../ports/aiClient';

export type { AIClient } from '../../ports/aiClient';

export async function getClient(): Promise<AIClient> {
  if (process.env.MOCK_AI === '1' || !process.env.OPENAI_API_KEY) {
    const { mockClient } = await import('./mockClient');
    return mockClient;
  }
  const { openaiClient } = await import('./openaiClient');
  return openaiClient;
}
