import { describe, expect, it } from 'vitest';
import { createReviewState, scheduleReview } from '../scheduler';

describe('scheduleReview', () => {
  const now = new Date('2026-08-09T12:00:00.000Z');

  it('resets the interval and records a lapse for Again', () => {
    const next = scheduleReview(
      createReviewState('big-o', 'complexity-basics-js', now),
      'again',
      now,
    );
    expect(next.intervalDays).toBe(1);
    expect(next.lapses).toBe(1);
    expect(next.repetitions).toBe(0);
  });

  it('schedules Easy farther than Good', () => {
    const current = createReviewState('big-o', 'complexity-basics-js', now);
    expect(scheduleReview(current, 'easy', now).intervalDays).toBeGreaterThan(
      scheduleReview(current, 'good', now).intervalDays,
    );
  });
});
