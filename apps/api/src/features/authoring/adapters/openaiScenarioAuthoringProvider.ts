import OpenAI from 'openai';
import { getDesignChallengeCatalog } from '../../simulations/domain/challenges';
import type { ScenarioAuthoringProvider } from '../ports/scenarioAuthoringProvider';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const openaiScenarioAuthoringProvider: ScenarioAuthoringProvider = {
  provider: 'openai',
  async generate(request) {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'Generate one strict AlgoFlow learning scenario draft as JSON. Never add keys outside the requested schema.',
            'Bubble schema: {id,version:1,kind:"bubble-sort",title,objective,difficulty,values:integer[3..8] in 1..99,expectedFinal:sorted values}.',
            'Design schema: {id,version:1,kind:"design-lab",title,objective,difficulty,scenarioSlug,challengeId,loadProfile,failure,predictionOptions,expectedPrimaryEffect}. Use only one exact catalog entry and include its prediction options. Do not invent references.',
            `Design catalog: ${JSON.stringify(getDesignChallengeCatalog())}`,
          ].join('\n\n'),
        },
        { role: 'user', content: JSON.stringify(request) },
      ],
    });
    const content = response.choices[0]?.message?.content;
    if (!content)
      throw new Error('The authoring provider returned no content.');
    return JSON.parse(content) as unknown;
  },
};
