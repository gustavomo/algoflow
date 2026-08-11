import { describe, expect, it } from 'vitest';
import { MemoryLearningRepository } from '../../../../platform/persistence/memoryRepository';
import { sendDueReminders } from '../sendDue';

describe('sendDueReminders', () => {
  it('deduplicates the same reminder window', async () => {
    const repository = new MemoryLearningRepository();
    const now = new Date('2026-08-09T13:00:00.000Z');
    await repository.saveReview({
      conceptId: 'big-o',
      lessonSlug: 'complexity-basics-js',
      intervalDays: 1,
      easeFactor: 2.5,
      repetitions: 0,
      lapses: 0,
      dueAt: now.toISOString(),
    });
    await repository.saveNotificationPreferences({
      enabled: true,
      timezone: 'America/Bogota',
      updatedAt: now.toISOString(),
    });
    await repository.savePushSubscription({
      endpoint: 'https://push.example/sub',
      expirationTime: null,
      keys: { p256dh: 'key', auth: 'auth' },
    });
    let sends = 0;
    const sender = {
      async send() {
        sends += 1;
      },
    };
    expect((await sendDueReminders(repository, sender, now)).sent).toBe(1);
    expect((await sendDueReminders(repository, sender, now)).skipped).toBe(1);
    expect(sends).toBe(1);
  });
});
