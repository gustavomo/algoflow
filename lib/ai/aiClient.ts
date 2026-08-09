export interface AIClient {
  ask(question: string, tech?: string, citations?: string[]): Promise<string>;
}

export async function getClient(): Promise<AIClient> {
  if (process.env.MOCK_AI === '1') {
    const { mockClient } = await import('./mockClient');
    return mockClient;
  }
  const { openaiClient } = await import('./openaiClient');
  return openaiClient;
}
