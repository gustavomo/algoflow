import { describe, expect, it } from 'vitest';
import { MemoryReadingRepository } from '../adapters/memoryReadingRepository';
import { MemoryLearningRepository } from '../../../platform/persistence/memoryRepository';
import {
  convertNoteToReview,
  createReadingBook,
  createReadingNote,
} from './readingUseCases';

describe('reading use cases', () => {
  it('converts one note into one idempotent review item', async () => {
    const reading = new MemoryReadingRepository();
    const learning = new MemoryLearningRepository();
    const book = await createReadingBook(reading, {
      title: `Book ${crypto.randomUUID()}`,
      author: 'Author',
      totalChapters: 4,
    });
    const note = await createReadingNote(reading, book.value!.id, {
      chapter: 1,
      body: 'A concise model.',
    });
    const input = { prompt: 'Recall the model', answer: 'The model answer' };
    const first = await convertNoteToReview(
      reading,
      learning,
      note.value!.id,
      input,
      new Date('2026-08-09T12:00:00.000Z'),
    );
    const second = await convertNoteToReview(
      reading,
      learning,
      note.value!.id,
      { ...input, answer: 'Updated answer' },
    );
    expect(first.value?.conceptId).toBe(second.value?.conceptId);
    expect((await learning.getSnapshot()).reviews).toContainEqual(
      expect.objectContaining({
        conceptId: first.value?.conceptId,
        answer: 'Updated answer',
        sourceType: 'reading-note',
      }),
    );
  });
});
