import OpenAI from 'openai';
import type { TutorProviderOutput } from '../../ports/tutorClient';
import type { TutorClient } from '../../ports/tutorClient';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const openaiTutorClient: TutorClient = {
  provider: 'openai',
  async tutor({ question, helpLevel, context, groundedContext }) {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'You are a context-aware technical tutor inside an interactive scene.',
            `Help level: ${helpLevel}. For nudge, do not reveal the answer. For guided-question, lead with questions. For explanation, be concise and explicit.`,
            'Return only JSON with message, optional followUpQuestion, and optional overlay.',
            'Use only IDs present in the scene. Bubble overlay: {kind:"highlight-items",itemIds:string[],label:string}. Design overlay: {kind:"highlight-system",nodeIds:string[],edgeIds:string[],label:string}.',
            `Local context:\n${groundedContext || 'No matching local chunk.'}`,
            `Scene:\n${JSON.stringify(context)}`,
          ].join('\n\n'),
        },
        { role: 'user', content: question },
      ],
    });
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('The tutor returned no content.');
    const parsed = JSON.parse(content) as Partial<TutorProviderOutput>;
    if (typeof parsed.message !== 'string' || !parsed.message.trim())
      throw new Error('The tutor returned an invalid message.');
    return {
      message: parsed.message.trim().slice(0, 2_400),
      followUpQuestion:
        typeof parsed.followUpQuestion === 'string'
          ? parsed.followUpQuestion.trim().slice(0, 600)
          : undefined,
      overlay: parsed.overlay,
    };
  },
};
