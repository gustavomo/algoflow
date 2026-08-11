import type { NextApiRequest, NextApiResponse } from 'next';
import { retrieveContext } from '@api/features/ai/application/retrieveContext';
import { localJsonRetriever } from '@api/features/ai/adapters/retrieval/retrieve';
import { withTimer } from '@api/platform/analytics/otel';
import { ApiError } from '@api/platform/http/errors';
import { privateApi } from '@api/platform/http/handlers';
import {
  clampedInteger,
  optionalDomain,
  optionalTech,
  requireString,
} from '@api/platform/http/validate';

export default privateApi(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET' && req.method !== 'POST')
    throw new ApiError(405, 'method_not_allowed', 'Use GET or POST.');
  const input = req.method === 'POST' ? req.body : req.query;
  const query = requireString(input?.q, 'q', 500);
  const tech = optionalTech(input?.tech);
  const domain = optionalDomain(input?.domain);
  const topK = clampedInteger(input?.topK, 5, 1, 10);
  const result = await withTimer('rag', async () =>
    retrieveContext(localJsonRetriever, query, { tech, domain, topK }),
  );
  res.status(200).json({ chunks: result.context });
});
