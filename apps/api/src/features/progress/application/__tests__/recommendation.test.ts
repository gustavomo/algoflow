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

  it('uses a valid focused path before the default curriculum', () => {
    const result = recommendNextActivity(
      [],
      [],
      new Date('2026-08-09T12:00:00.000Z'),
      'docker',
    );
    expect(result).toEqual(
      expect.objectContaining({
        kind: 'lesson',
        href: '/lessons/containers-and-images',
      }),
    );
  });

  it('falls back when a focused path contains only planned modules', () => {
    const result = recommendNextActivity(
      [],
      [],
      new Date('2026-08-09T12:00:00.000Z'),
      'system-design',
    );
    expect(result.href).toBe('/lessons/complexity-basics-js');
  });
});
