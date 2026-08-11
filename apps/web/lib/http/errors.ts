import type { NextApiResponse } from 'next';
import type { ApiErrorPayload } from '@algoflow/contracts';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly retryable = false,
  ) {
    super(message);
  }
}

export function sendApiError(res: NextApiResponse, error: unknown) {
  const apiError =
    error instanceof ApiError
      ? error
      : new ApiError(500, 'internal_error', 'Something went wrong.', true);
  res.status(apiError.status).json({
    error: {
      code: apiError.code,
      message: apiError.message,
      retryable: apiError.retryable,
    },
  } satisfies ApiErrorPayload);
}
