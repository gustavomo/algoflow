import type { AIClient } from './aiClient';

export const mockClient: AIClient = {
  provider: 'mock',
  async ask({ question, tech, context }) {
    const sourceSummary = context.length
      ? context
          .map((chunk, index) => `${index + 1}. ${chunk.content}`)
          .join('\n')
      : '1. Start from the lesson invariant and trace one concrete example.';
    return [
      `Question: ${question}`,
      '',
      `Step 1 — Identify the invariant${tech ? ` for ${tech.toUpperCase()}` : ''}.`,
      'Step 2 — Follow the state change one operation at a time.',
      'Step 3 — Check the stopping condition and complexity.',
      '',
      'Lesson context:',
      sourceSummary,
    ].join('\n');
  },
};
