import { createHash, timingSafeEqual } from 'node:crypto';
import type { NextApiRequest } from 'next';
import { ApiError } from './errors';

function equalSecrets(actual: string, expected: string) {
  const actualHash = createHash('sha256').update(actual).digest();
  const expectedHash = createHash('sha256').update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

function bearerToken(req: NextApiRequest) {
  const header = req.headers.authorization;
  return typeof header === 'string' && header.startsWith('Bearer ')
    ? header.slice('Bearer '.length)
    : '';
}

export function requireInternalAuth(req: NextApiRequest) {
  const expected = process.env.BACKEND_SHARED_SECRET;
  if (!expected || !equalSecrets(bearerToken(req), expected)) {
    throw new ApiError(
      401,
      'unauthorized_backend',
      'Backend authorization failed.',
    );
  }
}

export function requireCronAuth(req: NextApiRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected || !equalSecrets(bearerToken(req), expected)) {
    throw new ApiError(401, 'unauthorized_cron', 'Cron authorization failed.');
  }
}
