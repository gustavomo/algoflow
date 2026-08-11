import type { ReviewState } from '@algoflow/contracts';
import type { ReviewRepository } from '../../review/ports/reviewRepository';
import { buildBook, buildNote, reviewPrompt } from '../domain/reading';
import type { ReadingRepository } from '../ports/readingRepository';

export async function listReading(repository: ReadingRepository) {
  return repository.listBooks();
}

export async function getReadingBook(
  repository: ReadingRepository,
  bookId: string,
) {
  const book = await repository.getBook(bookId);
  if (!book) return undefined;
  return { book, notes: await repository.listNotes(bookId) };
}

export async function createReadingBook(
  repository: ReadingRepository,
  input: Record<string, unknown>,
) {
  const result = buildBook(input);
  return result.value
    ? { value: await repository.saveBook(result.value) }
    : { error: result.error };
}

export async function updateReadingBook(
  repository: ReadingRepository,
  bookId: string,
  input: Record<string, unknown>,
) {
  const current = await repository.getBook(bookId);
  if (!current) return { missing: true as const };
  const result = buildBook(input, current);
  return result.value
    ? { value: await repository.saveBook(result.value) }
    : { error: result.error };
}

export async function createReadingNote(
  repository: ReadingRepository,
  bookId: string,
  input: Record<string, unknown>,
) {
  const book = await repository.getBook(bookId);
  if (!book) return { missing: true as const };
  const result = buildNote(input, book);
  return result.value
    ? { value: await repository.saveNote(result.value) }
    : { error: result.error };
}

export async function convertNoteToReview(
  readingRepository: ReadingRepository,
  reviewRepository: ReviewRepository,
  noteId: string,
  input: Record<string, unknown>,
  now = new Date(),
) {
  const note = await readingRepository.getNote(noteId);
  const promptAnswer = reviewPrompt(input);
  if (!note) return { missing: true as const };
  if (!promptAnswer)
    return {
      error: 'Prompt and answer are required within the documented limits.',
    };
  const book = await readingRepository.getBook(note.bookId);
  const conceptId = `reading-note:${note.id}`;
  const existing = await reviewRepository.getReview(conceptId);
  const review: ReviewState = {
    conceptId,
    sourceType: 'reading-note',
    sourceId: note.id,
    title: book
      ? `${book.title}${note.chapter ? ` · Chapter ${note.chapter}` : ''}`
      : 'Technical reading note',
    prompt: promptAnswer.prompt,
    answer: promptAnswer.answer,
    intervalDays: existing?.intervalDays ?? 1,
    easeFactor: existing?.easeFactor ?? 2.5,
    repetitions: existing?.repetitions ?? 0,
    lapses: existing?.lapses ?? 0,
    dueAt:
      existing?.dueAt ?? new Date(now.getTime() + 86_400_000).toISOString(),
    lastReviewedAt: existing?.lastReviewedAt,
  };
  return { value: await reviewRepository.saveReview(review) };
}
