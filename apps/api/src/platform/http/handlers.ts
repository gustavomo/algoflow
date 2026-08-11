import type { NextApiRequest, NextApiResponse } from 'next';
import { sendApiError } from './errors';
import { requireInternalAuth } from './internalAuth';

type Handler = (
  req: NextApiRequest,
  res: NextApiResponse,
) => Promise<void> | void;

export function privateApi(handler: Handler) {
  return async function authenticatedHandler(
    req: NextApiRequest,
    res: NextApiResponse,
  ) {
    try {
      requireInternalAuth(req);
      await handler(req, res);
    } catch (error) {
      sendApiError(res, error);
    }
  };
}

export function safeApi(handler: Handler) {
  return async function safeHandler(req: NextApiRequest, res: NextApiResponse) {
    try {
      await handler(req, res);
    } catch (error) {
      sendApiError(res, error);
    }
  };
}
