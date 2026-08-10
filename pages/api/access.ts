import { createHash, timingSafeEqual } from 'node:crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  ACCESS_COOKIE_NAME,
  createAccessToken,
  isAccessBypassed,
} from '../../lib/access/token';
import { ApiError, sendApiError } from '../../lib/api/errors';
import {
  assertSameOrigin,
  requireMethod,
  requireString,
} from '../../lib/api/validate';

function equalCodes(actual: string, expected: string) {
  const actualHash = createHash('sha256').update(actual).digest();
  const expectedHash = createHash('sha256').update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    requireMethod(req, 'POST');
    assertSameOrigin(req);
    const code = requireString(req.body?.code, 'code', 256);
    const expected = process.env.APP_ACCESS_CODE;
    const secret = process.env.ACCESS_COOKIE_SECRET;

    if (isAccessBypassed()) {
      res.status(200).json({ ok: true, bypassed: true });
      return;
    }
    if (!expected || !secret) {
      throw new ApiError(
        503,
        'access_not_configured',
        'Personal access is not configured.',
        true,
      );
    }
    if (!equalCodes(code, expected)) {
      throw new ApiError(
        401,
        'invalid_access_code',
        'That access code is not valid.',
      );
    }

    const token = await createAccessToken(secret);
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader(
      'Set-Cookie',
      `${ACCESS_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000${secure}`,
    );
    res.status(200).json({ ok: true });
  } catch (error) {
    sendApiError(res, error);
  }
}
