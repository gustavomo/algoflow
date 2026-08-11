import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from '@api/features/notifications/application/preferences';
import { ApiError } from '@api/platform/http/errors';
import { privateApi } from '@api/platform/http/handlers';
import { requireString } from '@api/platform/http/validate';
import { getLearningRepository } from '@api/platform/persistence';

export default privateApi(async (req: NextApiRequest, res: NextApiResponse) => {
  const repository = getLearningRepository();
  if (req.method === 'GET') {
    res.status(200).json({
      preferences: await getNotificationPreferences(repository),
    });
    return;
  }
  if (req.method !== 'POST')
    throw new ApiError(405, 'method_not_allowed', 'Use GET or POST.');
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
  const preferences = await saveNotificationPreferences(repository, {
    enabled: req.body.enabled,
    timezone,
    updatedAt: new Date().toISOString(),
  });
  res.status(200).json({ preferences });
});
