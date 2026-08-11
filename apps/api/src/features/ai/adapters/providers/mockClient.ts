import type { AIClient } from '../../ports/aiClient';

export const mockClient: AIClient = {
  provider: 'mock',
  model: 'deterministic-v1',
  async ask({ question, tech, domain, context }) {
    const sourceSummary = context.length
      ? context
          .map((chunk, index) => `${index + 1}. ${chunk.content}`)
          .join('\n')
      : '1. Start from the lesson invariant and trace one concrete example.';
    return [
      `Question: ${question}`,
      '',
      `Step 1 — Identify the governing idea${tech ? ` for ${tech.toUpperCase()}` : ''}${domain ? ` in ${domain.replaceAll('-', ' ')}` : ''}.`,
      'Step 2 — Follow the state change one operation at a time.',
      'Step 3 — Check the stopping condition and complexity.',
      '',
      'Lesson context:',
      sourceSummary,
    ].join('\n');
  },
};
