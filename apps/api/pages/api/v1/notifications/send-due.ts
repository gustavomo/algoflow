import type { NextApiRequest, NextApiResponse } from 'next';
import webPush from 'web-push';
import { sendDueReminders } from '@api/features/notifications/application/sendDue';
import { ApiError } from '@api/platform/http/errors';
import { safeApi } from '@api/platform/http/handlers';
import { requireCronAuth } from '@api/platform/http/internalAuth';
import { getLearningRepository } from '@api/platform/persistence';

export default safeApi(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET')
    throw new ApiError(405, 'method_not_allowed', 'Use GET.');
  requireCronAuth(req);
  const publicKey =
    process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new ApiError(
      503,
      'push_not_configured',
      'Web Push is not configured.',
      true,
    );
  }
  webPush.setVapidDetails(subject, publicKey, privateKey);
  const result = await sendDueReminders(getLearningRepository(), {
    async send(subscription, payload) {
      await webPush.sendNotification(subscription, payload, {
        TTL: 60 * 60 * 12,
      });
    },
  });
  res.status(200).json(result);
});
