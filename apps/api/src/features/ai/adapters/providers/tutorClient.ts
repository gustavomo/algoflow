import type { TutorClient } from '../../ports/tutorClient';

export async function getTutorClient(): Promise<TutorClient> {
  if (process.env.MOCK_AI === '1' || !process.env.OPENAI_API_KEY) {
    const { mockTutorClient } = await import('./mockTutorClient');
    return mockTutorClient;
  }
  const { openaiTutorClient } = await import('./openaiTutorClient');
  return openaiTutorClient;
}
