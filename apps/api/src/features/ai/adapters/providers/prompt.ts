import type { AIRequest } from '../../ports/aiClient';

export function tutorSystemPrompt({ tech, domain, context }: AIRequest) {
  const groundedContext = context
    .map((chunk) => `[${chunk.id}] ${chunk.content}`)
    .join('\n');
  return `You are a technical learning tutor. Explain step by step, be concise, and use only the supplied lesson context. Never invent citations. Do not use tools or external sources. Curriculum domain: ${domain ?? 'unspecified'}. Technology: ${tech ?? 'unspecified'}.\n\nContext:\n${groundedContext || 'No matching local context was found.'}`;
}

export function tutorCliPrompt(request: AIRequest) {
  return `${tutorSystemPrompt(request)}\n\nLearner question:\n${request.question}`;
}
