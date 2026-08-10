import { describe, expect, it } from 'vitest';
import { recommendNextActivity } from '../recommendation';

describe('recommendNextActivity', () => {
  it('prioritizes an overdue review', () => {
    const result = recommendNextActivity(
      [],
      [
        {
          conceptId: 'big-o',
          lessonSlug: 'complexity-basics-js',
          intervalDays: 1,
          easeFactor: 2.5,
          repetitions: 1,
          lapses: 0,
          dueAt: '2026-08-08T12:00:00.000Z',
        },
      ],
      new Date('2026-08-09T12:00:00.000Z'),
    );
    expect(result.kind).toBe('review');
  });

  it('starts a new learner at the foundations path', () => {
    expect(recommendNextActivity([], []).href).toBe(
      '/lessons/complexity-basics-js',
    );
  });
});
