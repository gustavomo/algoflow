import { describe, expect, it } from 'vitest';
import { buildBook, buildNote, reviewPrompt } from './reading';

describe('reading domain', () => {
  const now = new Date('2026-08-09T12:00:00.000Z');

  it('builds a completed book with bounded progress', () => {
    const result = buildBook(
      {
        title: 'Designing Data-Intensive Applications',
        author: 'Martin Kleppmann',
        totalChapters: 12,
        currentChapter: 7,
        status: 'completed',
      },
      undefined,
      now,
    );
    expect(result.value).toEqual(
      expect.objectContaining({
        currentChapter: 12,
        completedAt: now.toISOString(),
      }),
    );
  });

  it('rejects progress beyond the final chapter', () => {
    expect(
      buildBook({
        title: 'Book',
        author: 'Author',
        totalChapters: 5,
        currentChapter: 6,
      }).error,
    ).toMatch(/chapter/i);
  });

  it('accepts concise notes and rejects invalid chapters', () => {
    const book = buildBook(
      { title: 'Book', author: 'Author', totalChapters: 5 },
      undefined,
      now,
    ).value!;
    expect(
      buildNote({ body: 'My model', chapter: 2 }, book, now).value?.chapter,
    ).toBe(2);
    expect(
      buildNote({ body: 'My model', chapter: 6 }, book, now).error,
    ).toMatch(/chapter/i);
  });

  it('requires both prompt and answer for review conversion', () => {
    expect(
      reviewPrompt({
        prompt: 'Explain the invariant',
        answer: 'One owner per fact.',
      }),
    ).toBeTruthy();
    expect(reviewPrompt({ prompt: 'Explain the invariant' })).toBeUndefined();
  });
});
