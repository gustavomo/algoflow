import type { NextApiRequest, NextApiResponse } from 'next';
import { getTutorClient } from '@api/features/ai/adapters/providers/tutorClient';
import { localJsonRetriever } from '@api/features/ai/adapters/retrieval/retrieve';
import { tutorLearner } from '@api/features/ai/application/tutorLearner';
import { parseTutorRequest } from '@api/features/ai/domain/tutorContext';
import { withTimer } from '@api/platform/analytics/otel';
import { hashCacheKey, memoWithStatus } from '@api/platform/cache/memo';
import { ApiError } from '@api/platform/http/errors';
import { privateApi } from '@api/platform/http/handlers';
import { requireMethod } from '@api/platform/http/validate';

export default privateApi(async (req: NextApiRequest, res: NextApiResponse) => {
  requireMethod(req, 'POST');
  const parsed = parseTutorRequest(req.body);
  if (!parsed.value)
    throw new ApiError(
      400,
      'invalid_tutor_context',
      parsed.error ?? 'Tutor context is invalid.',
    );
  const client = await getTutorClient();
  const key = hashCacheKey({
    request: parsed.value,
    provider: client.provider,
  });
  try {
    const result = await withTimer('tutor', () =>
      memoWithStatus(key, () =>
        tutorLearner(client, localJsonRetriever, parsed.value!),
      ),
    );
    if (!result.value.resolved)
      throw new ApiError(
        400,
        'unknown_citation',
        'Every citation must resolve to local lesson content.',
      );
    const { resolved: _resolved, ...payload } = result.value;
    res.status(200).json({ ...payload, cached: result.cached });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      502,
      'tutor_provider_error',
      'The tutor is temporarily unavailable.',
      true,
    );
  }
});
