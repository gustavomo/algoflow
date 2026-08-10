import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiError, sendApiError } from '../../../lib/api/errors';
import { assertSameOrigin, requireString } from '../../../lib/api/validate';
import { getLearningRepository } from '../../../lib/persistence';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const repository = getLearningRepository();
    if (req.method === 'GET') {
      const { notificationPreferences } = await repository.getSnapshot();
      res.status(200).json({ preferences: notificationPreferences });
      return;
    }
    if (req.method !== 'POST') {
      throw new ApiError(405, 'method_not_allowed', 'Use GET or POST.');
    }
    assertSameOrigin(req);
    if (typeof req.body?.enabled !== 'boolean') {
      throw new ApiError(
        400,
        'invalid_preferences',
        'enabled must be a boolean.',
      );
    }
    const timezone = requireString(req.body?.timezone, 'timezone', 80);
    try {
      new Intl.DateTimeFormat('en', { timeZone: timezone }).format(new Date());
    } catch {
      throw new ApiError(400, 'invalid_timezone', 'Use a valid IANA timezone.');
    }
    const preferences = await repository.saveNotificationPreferences({
      enabled: req.body.enabled,
      timezone,
      updatedAt: new Date().toISOString(),
    });
    res.status(200).json({ preferences });
  } catch (error) {
    sendApiError(res, error);
  }
}
