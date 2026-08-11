import OpenAI from 'openai';
import type { AIClient } from '../../ports/aiClient';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const openaiClient: AIClient = {
  provider: 'openai',
  async ask({ question, tech, domain, context }) {
    const groundedContext = context
      .map((chunk) => `[${chunk.id}] ${chunk.content}`)
      .join('\n');
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: `You are a technical learning tutor. Explain step by step, be concise, and use only the supplied lesson context. Never invent citations. Curriculum domain: ${domain ?? 'unspecified'}. Technology: ${tech ?? 'unspecified'}.\n\nContext:\n${groundedContext || 'No matching local context was found.'}`,
        },
        { role: 'user', content: question },
      ],
    });
    return (
      response.choices[0]?.message?.content?.trim() ||
      'No explanation was returned.'
    );
  },
};
