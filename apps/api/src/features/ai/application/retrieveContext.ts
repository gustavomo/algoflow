import type { CurriculumDomain, Tech } from '@algoflow/contracts';
import type { Retriever } from '../ports/retriever';

export function retrieveContext(
  retriever: Retriever,
  query: string,
  options: {
    tech?: Tech;
    domain?: CurriculumDomain;
    topK?: number;
    citationIds?: string[];
  } = {},
) {
  if (options.citationIds?.length) {
    const context = retriever.resolve(options.citationIds);
    return {
      context,
      everyCitationResolved:
        context.length === new Set(options.citationIds).size,
    };
  }
  return {
    context: retriever
      .retrieve(query, {
        tech: options.tech,
        domain: options.domain,
        topK: options.topK,
      })
      .map(({ score: _score, ...chunk }) => chunk),
    everyCitationResolved: true,
  };
}
