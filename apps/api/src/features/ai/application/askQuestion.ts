import type { CurriculumDomain, Tech } from '@algoflow/contracts';
import type { AIClient } from '../ports/aiClient';
import type { Retriever } from '../ports/retriever';
import { retrieveContext } from './retrieveContext';

export interface AskQuestionInput {
  question: string;
  tech?: Tech;
  domain?: CurriculumDomain;
  citationIds?: string[];
}

export async function askQuestion(
  client: AIClient,
  retriever: Retriever,
  input: AskQuestionInput,
) {
  const retrieval = retrieveContext(retriever, input.question, {
    tech: input.tech,
    domain: input.domain,
    topK: 5,
    citationIds: input.citationIds,
  });
  if (!retrieval.everyCitationResolved) return { resolved: false as const };
  return {
    resolved: true as const,
    answer: await client.ask({
      question: input.question,
      tech: input.tech,
      domain: input.domain,
      context: retrieval.context,
    }),
    citations: retrieval.context,
    provider: client.provider,
  };
}
