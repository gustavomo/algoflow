import { describe, expect, it } from 'vitest';
import { shouldUseMemoryPersistence } from '../index';
import { MemoryLearningRepository } from '../memoryRepository';

describe('MemoryLearningRepository', () => {
  it('keeps server memory out of production', () => {
    expect(
      shouldUseMemoryPersistence({
        NODE_ENV: 'production',
        MOCK_PERSISTENCE: '1',
      }),
    ).toBe(false);
    expect(
      shouldUseMemoryPersistence({
        NODE_ENV: 'development',
        MOCK_PERSISTENCE: '1',
      }),
    ).toBe(true);
  });

  it('persists lesson progress and returns due reviews in order', async () => {
    const repository = new MemoryLearningRepository();
    const suffix = crypto.randomUUID();
    const earlier = `concept-earlier-${suffix}`;
    const later = `concept-later-${suffix}`;

    await repository.saveLessonProgress({
      lessonSlug: `lesson-${suffix}`,
      status: 'in-progress',
      percent: 45,
      updatedAt: '2026-08-09T12:00:00.000Z',
    });
    await repository.saveReview({
      conceptId: later,
      lessonSlug: `lesson-${suffix}`,
      intervalDays: 1,
      easeFactor: 2.5,
      repetitions: 0,
      lapses: 0,
      dueAt: '2026-08-09T12:00:00.000Z',
    });
    await repository.saveReview({
      conceptId: earlier,
      lessonSlug: `lesson-${suffix}`,
      intervalDays: 1,
      easeFactor: 2.5,
      repetitions: 0,
      lapses: 0,
      dueAt: '2026-08-08T12:00:00.000Z',
    });

    const snapshot = await repository.getSnapshot();
    const due = await repository.listDueReviews(
      new Date('2026-08-10T00:00:00.000Z'),
    );

    expect(snapshot.progress).toContainEqual(
      expect.objectContaining({ lessonSlug: `lesson-${suffix}`, percent: 45 }),
    );
    expect(due.map((review) => review.conceptId)).toEqual(
      expect.arrayContaining([earlier, later]),
    );
    expect(
      due.findIndex((review) => review.conceptId === earlier),
    ).toBeLessThan(due.findIndex((review) => review.conceptId === later));
  });

  it('releases a failed notification claim for retry', async () => {
    const repository = new MemoryLearningRepository();
    const endpoint = `https://push.example/${crypto.randomUUID()}`;

    expect(await repository.claimNotificationDelivery(endpoint, 'daily')).toBe(
      true,
    );
    expect(await repository.claimNotificationDelivery(endpoint, 'daily')).toBe(
      false,
    );
    await repository.releaseNotificationDelivery(endpoint, 'daily');
    expect(await repository.claimNotificationDelivery(endpoint, 'daily')).toBe(
      true,
    );
  });

  it('persists and clears the focused path on the server adapter', async () => {
    const repository = new MemoryLearningRepository();
    await repository.setFocusedPath('docker');
    expect(await repository.getFocusedPath()).toBe('docker');
    expect((await repository.getSnapshot()).focusedPathSlug).toBe('docker');
    await repository.setFocusedPath();
    expect(await repository.getFocusedPath()).toBeUndefined();
  });

  it('records an assessment as completed progress with review evidence', async () => {
    const repository = new MemoryLearningRepository();
    const suffix = crypto.randomUUID();
    const createdAt = '2026-08-09T12:00:00.000Z';

    await repository.recordAssessment({
      attempt: {
        id: suffix,
        assessmentSlug: `assessment-${suffix}`,
        lessonSlug: `lesson-${suffix}`,
        score: 50,
        correctCount: 1,
        totalCount: 2,
        answers: {},
        failedConceptIds: [`missed-${suffix}`],
        durationSeconds: 30,
        createdAt,
      },
      evidence: [
        {
          conceptId: `correct-${suffix}`,
          lessonSlug: `lesson-${suffix}`,
          correct: true,
        },
        {
          conceptId: `missed-${suffix}`,
          lessonSlug: `lesson-${suffix}`,
          correct: false,
        },
      ],
    });

    const snapshot = await repository.getSnapshot();
    expect(snapshot.progress).toContainEqual(
      expect.objectContaining({
        lessonSlug: `lesson-${suffix}`,
        status: 'completed',
        percent: 100,
      }),
    );
    expect(await repository.getReview(`correct-${suffix}`)).toEqual(
      expect.objectContaining({ dueAt: '2026-08-12T12:00:00.000Z' }),
    );
    expect(await repository.getReview(`missed-${suffix}`)).toEqual(
      expect.objectContaining({
        dueAt: '2026-08-10T12:00:00.000Z',
        lapses: 1,
      }),
    );
  });

  it('records diagnostic evidence without completing a lesson', async () => {
    const repository = new MemoryLearningRepository();
    const suffix = crypto.randomUUID();
    await repository.recordAssessment({
      attempt: {
        id: suffix,
        assessmentSlug: `diagnostic-${suffix}`,
        lessonSlug: `path-${suffix}`,
        score: 75,
        correctCount: 3,
        totalCount: 4,
        answers: {},
        failedConceptIds: [`readiness-${suffix}`],
        durationSeconds: 45,
        createdAt: '2026-08-09T12:00:00.000Z',
      },
      updatesLessonProgress: false,
      updatesMastery: false,
      evidence: [
        {
          conceptId: `readiness-${suffix}`,
          sourceType: 'checkpoint',
          sourceId: `diagnostic-${suffix}`,
          title: 'Readiness diagnostic',
          prompt: 'Recover the missing prerequisite.',
          answer: 'Review the path foundation.',
          correct: false,
        },
      ],
    });

    const snapshot = await repository.getSnapshot();
    expect(
      snapshot.progress.some((item) => item.lessonSlug === `path-${suffix}`),
    ).toBe(false);
    expect(await repository.getReview(`readiness-${suffix}`)).toEqual(
      expect.objectContaining({
        sourceType: 'checkpoint',
        sourceId: `diagnostic-${suffix}`,
        lessonSlug: undefined,
      }),
    );
  });
});
