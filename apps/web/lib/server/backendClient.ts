import 'server-only';
import { isApiErrorPayload } from '@algoflow/contracts';

export class BackendRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly retryable: boolean,
  ) {
    super(message);
  }
}

function configuration() {
  const url = process.env.BACKEND_URL;
  const secret = process.env.BACKEND_SHARED_SECRET;
  if (!url || !secret) {
    throw new BackendRequestError(
      503,
      'backend_not_configured',
      'The learning backend is not configured.',
      true,
    );
  }
  return { url: url.replace(/\/$/, ''), secret };
}

export async function backendRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { url, secret } = configuration();
  let response: Response;
  try {
    response = await fetch(`${url}${path}`, {
      ...init,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${secret}`,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new BackendRequestError(
      503,
      'backend_unavailable',
      'The learning backend is temporarily unavailable.',
      true,
    );
  }
  const body: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    if (isApiErrorPayload(body)) {
      throw new BackendRequestError(
        response.status,
        body.error.code,
        body.error.message,
        body.error.retryable,
      );
    }
    throw new BackendRequestError(
      response.status,
      'backend_error',
      'The learning backend returned an invalid response.',
      response.status >= 500,
    );
  }
  return body as T;
}
