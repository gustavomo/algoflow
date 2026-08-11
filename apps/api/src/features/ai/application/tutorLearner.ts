import type { TutorRequest } from '@algoflow/contracts';
import { sanitizeTutorOverlay } from '../domain/tutorContext';
import type { Retriever } from '../ports/retriever';
import type { TutorClient } from '../ports/tutorClient';
import { retrieveContext } from './retrieveContext';

function retrievalQuery(input: TutorRequest) {
  if (input.context.kind === 'bubble-sort')
    return `${input.question} bubble sort adjacent comparison swap`;
  return `${input.question} ${input.context.scenarioSlug.replaceAll('-', ' ')} system design`;
}

export async function tutorLearner(
  client: TutorClient,
  retriever: Retriever,
  input: TutorRequest,
) {
  const retrieval = retrieveContext(retriever, retrievalQuery(input), {
    domain:
      input.context.kind === 'bubble-sort' ? 'algorithms' : 'architecture',
    topK: 4,
    citationIds: input.citations,
  });
  if (!retrieval.everyCitationResolved) return { resolved: false as const };
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const output = await Promise.race([
    client.tutor({
      question: input.question,
      helpLevel: input.helpLevel,
      context: input.context,
      groundedContext: retrieval.context
        .map((chunk) => `[${chunk.id}] ${chunk.content}`)
        .join('\n'),
    }),
    new Promise<never>((_, reject) => {
      timeout = setTimeout(
        () => reject(new Error('Tutor provider timed out.')),
        12_000,
      );
    }),
  ]).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
  return {
    resolved: true as const,
    message: output.message.trim().slice(0, 2_400),
    followUpQuestion: output.followUpQuestion?.trim().slice(0, 600),
    overlay: sanitizeTutorOverlay(output.overlay, input.context),
    citations: retrieval.context,
    provider: client.provider,
  };
}
