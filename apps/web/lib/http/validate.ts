import type { NextApiRequest } from 'next';
import { ApiError } from './errors';

export function requireMethod(
  req: NextApiRequest,
  method: 'GET' | 'POST' | 'DELETE',
) {
  if (req.method !== method)
    throw new ApiError(
      405,
      'method_not_allowed',
      `Use ${method} for this endpoint.`,
    );
}

export function requireString(
  value: unknown,
  field: string,
  maxLength = 2_000,
) {
  if (typeof value !== 'string' || !value.trim())
    throw new ApiError(400, 'invalid_request', `${field} is required.`);
  const normalized = value.trim();
  if (normalized.length > maxLength)
    throw new ApiError(400, 'invalid_request', `${field} is too long.`);
  return normalized;
}

export function assertSameOrigin(req: NextApiRequest) {
  const origin = req.headers.origin;
  if (!origin) return;
  const host = req.headers['x-forwarded-host'] ?? req.headers.host;
  const protocol =
    req.headers['x-forwarded-proto'] ??
    (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  if (!host || origin !== `${protocol}://${host}`)
    throw new ApiError(403, 'invalid_origin', 'Request origin is not allowed.');
}
