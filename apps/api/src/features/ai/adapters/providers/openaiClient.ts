import OpenAI from 'openai';
import type { AIClient } from '../../ports/aiClient';
import { tutorSystemPrompt } from './prompt';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const openaiClient: AIClient = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  async ask(request) {
    const response = await client.chat.completions.create(
      {
        model: openaiClient.model,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: tutorSystemPrompt(request),
          },
          { role: 'user', content: request.question },
        ],
      },
      { signal: request.signal },
    );
    return (
      response.choices[0]?.message?.content?.trim() ||
      'No explanation was returned.'
    );
  },
};
