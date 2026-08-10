import type { PushSubscriptionRecord } from '../learning/types';
import type { LearningRepository } from '../persistence/types';

export interface PushSender {
  send(subscription: PushSubscriptionRecord, payload: string): Promise<void>;
}

export interface PushFailure extends Error {
  statusCode?: number;
}

export async function sendDueReminders(
  repository: LearningRepository,
  sender: PushSender,
  now = new Date(),
) {
  const snapshot = await repository.getSnapshot();
  const due = snapshot.reviews.filter(
    (review) => new Date(review.dueAt) <= now,
  );
  if (!snapshot.notificationPreferences.enabled || due.length === 0) {
    return { due: due.length, sent: 0, skipped: 0, deactivated: 0, failed: 0 };
  }
  const dateKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: snapshot.notificationPreferences.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const dedupeKey = `due-review:${dateKey}`;
  const subscriptions = await repository.listActivePushSubscriptions();
  const result = {
    due: due.length,
    sent: 0,
    skipped: 0,
    deactivated: 0,
    failed: 0,
  };
  const payload = JSON.stringify({
    title: 'AlgoFlow review is ready',
    body: `${due.length} concept${due.length === 1 ? ' is' : 's are'} due today.`,
    url: '/review',
    tag: dedupeKey,
  });

  for (const subscription of subscriptions) {
    if (
      !(await repository.claimNotificationDelivery(
        subscription.endpoint,
        dedupeKey,
      ))
    ) {
      result.skipped += 1;
      continue;
    }
    try {
      await sender.send(subscription, payload);
      result.sent += 1;
    } catch (error) {
      const statusCode = (error as PushFailure).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await repository.deactivatePushSubscription(subscription.endpoint);
        result.deactivated += 1;
      } else {
        await repository.releaseNotificationDelivery(
          subscription.endpoint,
          dedupeKey,
        );
        result.failed += 1;
      }
    }
  }
  return result;
}
