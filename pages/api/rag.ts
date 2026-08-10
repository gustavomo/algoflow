import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiError, sendApiError } from '../../lib/api/errors';
import {
  clampedInteger,
  optionalTech,
  requireString,
} from '../../lib/api/validate';
import { withTimer } from '../../lib/analytics/otel';
import { localJsonRetriever } from '../../lib/rag/retrieve';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    if (req.method !== 'GET' && req.method !== 'POST')
      throw new ApiError(405, 'method_not_allowed', 'Use GET or POST.');
    const input = req.method === 'POST' ? req.body : req.query;
    const query = requireString(input?.q, 'q', 500);
    const tech = optionalTech(input?.tech);
    const topK = clampedInteger(input?.topK, 5, 1, 10);
    const retrieved = await withTimer('rag', async () =>
      localJsonRetriever.retrieve(query, { tech, topK }),
    );
    const chunks = retrieved.map(({ score: _score, ...chunk }) => chunk);
    res.status(200).json({ chunks });
  } catch (error) {
    sendApiError(res, error);
  }
}
