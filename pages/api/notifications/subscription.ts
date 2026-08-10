import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiError, sendApiError } from '../../../lib/api/errors';
import { assertSameOrigin, requireString } from '../../../lib/api/validate';
import type { PushSubscriptionRecord } from '../../../lib/learning/types';
import { getLearningRepository } from '../../../lib/persistence';

function parseSubscription(value: any): PushSubscriptionRecord {
  if (!value || typeof value !== 'object')
    throw new ApiError(
      400,
      'invalid_subscription',
      'Subscription is required.',
    );
  return {
    endpoint: requireString(value.endpoint, 'endpoint', 2_048),
    expirationTime:
      typeof value.expirationTime === 'number' ? value.expirationTime : null,
    keys: {
      p256dh: requireString(value.keys?.p256dh, 'p256dh', 512),
      auth: requireString(value.keys?.auth, 'auth', 512),
    },
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    assertSameOrigin(req);
    const repository = getLearningRepository();
    if (req.method === 'POST') {
      const subscription = parseSubscription(req.body?.subscription);
      await repository.savePushSubscription(subscription);
      res.status(200).json({ ok: true });
      return;
    }
    if (req.method === 'DELETE') {
      const endpoint = requireString(req.body?.endpoint, 'endpoint', 2_048);
      await repository.removePushSubscription(endpoint);
      res.status(200).json({ ok: true });
      return;
    }
    throw new ApiError(405, 'method_not_allowed', 'Use POST or DELETE.');
  } catch (error) {
    sendApiError(res, error);
  }
}
