import type { PushSubscriptionRecord } from '@algoflow/contracts';
import type { NotificationRepository } from '../ports/notificationRepository';

export function saveSubscription(
  repository: NotificationRepository,
  subscription: PushSubscriptionRecord,
) {
  return repository.savePushSubscription(subscription);
}

export function removeSubscription(
  repository: NotificationRepository,
  endpoint: string,
) {
  return repository.removePushSubscription(endpoint);
}
