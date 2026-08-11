import type { ScenarioAuthoringProvider } from '../ports/scenarioAuthoringProvider';

export async function getScenarioAuthoringProvider(): Promise<ScenarioAuthoringProvider> {
  if (process.env.MOCK_AI === '1' || !process.env.OPENAI_API_KEY) {
    const { mockScenarioAuthoringProvider } = await import(
      './mockScenarioAuthoringProvider'
    );
    return mockScenarioAuthoringProvider;
  }
  const { openaiScenarioAuthoringProvider } = await import(
    './openaiScenarioAuthoringProvider'
  );
  return openaiScenarioAuthoringProvider;
}
