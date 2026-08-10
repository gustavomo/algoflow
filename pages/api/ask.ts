import type { NextApiRequest, NextApiResponse } from 'next';
import { getClient } from '../../lib/ai/aiClient';
import { ApiError, sendApiError } from '../../lib/api/errors';
import {
  assertSameOrigin,
  optionalTech,
  requireMethod,
  requireString,
} from '../../lib/api/validate';
import { withTimer } from '../../lib/analytics/otel';
import { hashCacheKey, memoWithStatus } from '../../lib/cache/memo';
import { localJsonRetriever } from '../../lib/rag/retrieve';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    requireMethod(req, 'POST');
    assertSameOrigin(req);
    const question = requireString(req.body?.question, 'question', 2_000);
    const tech = optionalTech(req.body?.tech);
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
    const context = citationIds?.length
      ? localJsonRetriever.resolve(citationIds)
      : localJsonRetriever
          .retrieve(question, { tech, topK: 5 })
          .map(({ score: _score, ...chunk }) => chunk);
    if (citationIds?.length && context.length !== new Set(citationIds).size) {
      throw new ApiError(
        400,
        'unknown_citation',
        'Every citation must resolve to local lesson content.',
      );
    }

    const client = await getClient();
    const key = hashCacheKey({
      question: question.toLocaleLowerCase(),
      tech,
      context: context.map((chunk) => chunk.id),
      provider: client.provider,
    });
    let result;
    try {
      result = await withTimer('ask', () =>
        memoWithStatus(key, () => client.ask({ question, tech, context })),
      );
    } catch {
      throw new ApiError(
        502,
        'ai_provider_error',
        'The explanation provider is temporarily unavailable.',
        true,
      );
    }
    res.status(200).json({
      answer: result.value,
      citations: context,
      provider: client.provider,
      cached: result.cached,
    });
  } catch (error) {
    sendApiError(res, error);
  }
}
