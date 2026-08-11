import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from '@api/platform/http/errors';
import { safeApi } from '@api/platform/http/handlers';

export default safeApi((req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET')
    throw new ApiError(405, 'method_not_allowed', 'Use GET.');
  res.status(200).json({ ok: true, service: 'algoflow-api', version: 'v1' });
});
