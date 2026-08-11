import type { NextApiRequest, NextApiResponse } from 'next';
import { askQuestion } from '@api/features/ai/application/askQuestion';
import { getClient } from '@api/features/ai/adapters/providers/aiClient';
import { localJsonRetriever } from '@api/features/ai/adapters/retrieval/retrieve';
import { withTimer } from '@api/platform/analytics/otel';
import { hashCacheKey, memoWithStatus } from '@api/platform/cache/memo';
import { ApiError } from '@api/platform/http/errors';
import { aiProviderApiError } from '@api/platform/http/aiProviderErrors';
import { privateApi } from '@api/platform/http/handlers';
import { requestAbort } from '@api/platform/http/requestAbort';
import {
  optionalDomain,
  optionalAIProviderSelection,
  optionalTech,
  requireMethod,
  requireString,
} from '@api/platform/http/validate';

export default privateApi(async (req: NextApiRequest, res: NextApiResponse) => {
  requireMethod(req, 'POST');
  const question = requireString(req.body?.question, 'question', 2_000);
  const tech = optionalTech(req.body?.tech);
  const domain = optionalDomain(req.body?.domain);
  const providerSelection = optionalAIProviderSelection(req.body);
  const citationIds = req.body?.citations;
  if (
    citationIds != null &&
    (!Array.isArray(citationIds) ||
      citationIds.length > 8 ||
      citationIds.some((id) => typeof id !== 'string'))
  ) {
    throw new ApiError(
      400,
      'invalid_citations',
      'citations must contain at most eight local citation IDs.',
    );
  }
  const abort = requestAbort(req, res);
  let client;
  try {
    client = await getClient(providerSelection);
  } catch (error) {
    abort.cleanup();
    throw aiProviderApiError(error) ?? error;
  }
  const key = hashCacheKey({
    question: question.toLocaleLowerCase(),
    tech,
    domain,
    citations: citationIds,
    provider: client.provider,
    model: client.model,
    effort: client.effort,
  });
  let result;
  try {
    result = await withTimer('ask', () =>
      memoWithStatus(key, () =>
        askQuestion(client, localJsonRetriever, {
          question,
          tech,
          domain,
          citationIds,
          signal: abort.signal,
        }),
      ),
    );
  } catch (error) {
    abort.cleanup();
    const providerError = aiProviderApiError(error);
    if (providerError) throw providerError;
    throw new ApiError(
      502,
      'ai_provider_error',
      'The explanation provider is temporarily unavailable.',
      true,
    );
  }
  if (!result.value.resolved) {
    abort.cleanup();
    throw new ApiError(
      400,
      'unknown_citation',
      'Every citation must resolve to local lesson content.',
    );
  }
  const { resolved: _resolved, ...answer } = result.value;
  abort.cleanup();
  res.status(200).json({ ...answer, cached: result.cached });
});
