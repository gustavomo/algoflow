import type { ReadingBook, ReadingNote } from '@algoflow/contracts';
import type { ReadingRepository } from '../ports/readingRepository';

interface ReadingMemoryState {
  books: Map<string, ReadingBook>;
  notes: Map<string, ReadingNote>;
}

declare global {
  // eslint-disable-next-line no-var
  var __algoflowReadingMemory: ReadingMemoryState | undefined;
}

function state() {
  if (!globalThis.__algoflowReadingMemory) {
    globalThis.__algoflowReadingMemory = { books: new Map(), notes: new Map() };
  }
  return globalThis.__algoflowReadingMemory;
}

export class MemoryReadingRepository implements ReadingRepository {
  async listBooks() {
    return Array.from(state().books.values()).sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    );
  }

  async getBook(id: string) {
    return state().books.get(id);
  }

  async saveBook(book: ReadingBook) {
    state().books.set(book.id, book);
    return book;
  }

  async deleteBook(id: string) {
    for (const [noteId, note] of state().notes)
      if (note.bookId === id) state().notes.delete(noteId);
    return state().books.delete(id);
  }

  async listNotes(bookId: string) {
    return Array.from(state().notes.values())
      .filter((note) => note.bookId === bookId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  async getNote(id: string) {
    return state().notes.get(id);
  }

  async saveNote(note: ReadingNote) {
    state().notes.set(note.id, note);
    return note;
  }

  async deleteNote(id: string) {
    return state().notes.delete(id);
  }
}
