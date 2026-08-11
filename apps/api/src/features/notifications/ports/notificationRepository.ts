import type {
  LearningSnapshot,
  NotificationPreferences,
  PushSubscriptionRecord,
} from '@algoflow/contracts';

export interface NotificationRepository {
  getSnapshot(): Promise<LearningSnapshot>;
  saveNotificationPreferences(
    preferences: NotificationPreferences,
  ): Promise<NotificationPreferences>;
  savePushSubscription(subscription: PushSubscriptionRecord): Promise<void>;
  removePushSubscription(endpoint: string): Promise<void>;
  listActivePushSubscriptions(): Promise<PushSubscriptionRecord[]>;
  claimNotificationDelivery(
    endpoint: string,
    dedupeKey: string,
  ): Promise<boolean>;
  releaseNotificationDelivery(
    endpoint: string,
    dedupeKey: string,
  ): Promise<void>;
  deactivatePushSubscription(endpoint: string): Promise<void>;
}
