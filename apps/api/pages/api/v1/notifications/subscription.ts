import type { NextApiRequest, NextApiResponse } from 'next';
import type { PushSubscriptionRecord } from '@algoflow/contracts';
import {
  removeSubscription,
  saveSubscription,
} from '@api/features/notifications/application/subscriptions';
import { ApiError } from '@api/platform/http/errors';
import { privateApi } from '@api/platform/http/handlers';
import { requireString } from '@api/platform/http/validate';
import { getLearningRepository } from '@api/platform/persistence';

function parseSubscription(value: unknown): PushSubscriptionRecord {
  if (!value || typeof value !== 'object')
    throw new ApiError(
      400,
      'invalid_subscription',
      'Subscription is required.',
    );
  const subscription = value as Record<string, any>;
  return {
    endpoint: requireString(subscription.endpoint, 'endpoint', 2_048),
    expirationTime:
      typeof subscription.expirationTime === 'number'
        ? subscription.expirationTime
        : null,
    keys: {
      p256dh: requireString(subscription.keys?.p256dh, 'p256dh', 512),
      auth: requireString(subscription.keys?.auth, 'auth', 512),
    },
  };
}

export default privateApi(async (req: NextApiRequest, res: NextApiResponse) => {
  const repository = getLearningRepository();
  if (req.method === 'POST') {
    await saveSubscription(
      repository,
      parseSubscription(req.body?.subscription),
    );
    res.status(200).json({ ok: true });
    return;
  }
  if (req.method === 'DELETE') {
    await removeSubscription(
      repository,
      requireString(req.body?.endpoint, 'endpoint', 2_048),
    );
    res.status(200).json({ ok: true });
    return;
  }
  throw new ApiError(405, 'method_not_allowed', 'Use POST or DELETE.');
});
