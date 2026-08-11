import type { NotificationPreferences } from '@algoflow/contracts';
import type { NotificationRepository } from '../ports/notificationRepository';

export async function getNotificationPreferences(
  repository: NotificationRepository,
) {
  return (await repository.getSnapshot()).notificationPreferences;
}

export function saveNotificationPreferences(
  repository: NotificationRepository,
  preferences: NotificationPreferences,
) {
  return repository.saveNotificationPreferences(preferences);
}
