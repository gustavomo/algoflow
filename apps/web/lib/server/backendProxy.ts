import type { NextApiRequest, NextApiResponse } from 'next';
import { backendRequest, BackendRequestError } from './backendClient';
import { ApiError } from '../http/errors';
import { assertSameOrigin } from '../http/validate';

function queryString(query: NextApiRequest['query']) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value != null) params.set(key, value);
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : '';
}

export function createBackendProxy(path: string) {
  return async function backendProxy(
    req: NextApiRequest,
    res: NextApiResponse,
  ) {
    try {
      if (req.method !== 'GET') assertSameOrigin(req);
      const body = await backendRequest<unknown>(
        `${path}${req.method === 'GET' ? queryString(req.query) : ''}`,
        {
          method: req.method,
          body:
            req.method === 'GET' || req.body == null
              ? undefined
              : JSON.stringify(req.body),
        },
      );
      res.status(200).json(body);
    } catch (error) {
      const backendError =
        error instanceof BackendRequestError
          ? error
          : error instanceof ApiError
            ? new BackendRequestError(
                error.status,
                error.code,
                error.message,
                error.retryable,
              )
            : new BackendRequestError(
                500,
                'internal_error',
                'Something went wrong.',
                true,
              );
      res.status(backendError.status).json({
        error: {
          code: backendError.code,
          message: backendError.message,
          retryable: backendError.retryable,
        },
      });
    }
  };
}
