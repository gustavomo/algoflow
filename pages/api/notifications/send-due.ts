import type { NextApiRequest, NextApiResponse } from 'next';
import webPush from 'web-push';
import { ApiError, sendApiError } from '../../../lib/api/errors';
import { sendDueReminders } from '../../../lib/notifications/sendDue';
import { getLearningRepository } from '../../../lib/persistence';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    if (req.method !== 'GET')
      throw new ApiError(405, 'method_not_allowed', 'Use GET.');
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
      throw new ApiError(
        401,
        'unauthorized_cron',
        'Cron authorization failed.',
      );
    }
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
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
  } catch (error) {
    sendApiError(res, error);
  }
}
