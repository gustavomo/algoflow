import type { NextApiRequest, NextApiResponse } from 'next';

export function requestAbort(
  req: NextApiRequest,
  res: NextApiResponse,
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const onAborted = () => controller.abort();
  const onClosed = () => {
    if (!res.writableEnded) controller.abort();
  };
  req.once('aborted', onAborted);
  res.once('close', onClosed);
  return {
    signal: controller.signal,
    cleanup() {
      req.off('aborted', onAborted);
      res.off('close', onClosed);
    },
  };
}
