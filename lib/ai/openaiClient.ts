import { AIClient } from './aiClient';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const openaiClient: AIClient = {
  async ask(question, tech, citations) {
    const res = await client.responses.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      input: question,
    });
    return res.output_text || '';
  },
};
