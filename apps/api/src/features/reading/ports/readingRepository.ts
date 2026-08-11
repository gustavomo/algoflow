import type { ReadingBook, ReadingNote } from '@algoflow/contracts';

export interface ReadingRepository {
  listBooks(): Promise<ReadingBook[]>;
  getBook(id: string): Promise<ReadingBook | undefined>;
  saveBook(book: ReadingBook): Promise<ReadingBook>;
  deleteBook(id: string): Promise<boolean>;
  listNotes(bookId: string): Promise<ReadingNote[]>;
  getNote(id: string): Promise<ReadingNote | undefined>;
  saveNote(note: ReadingNote): Promise<ReadingNote>;
  deleteNote(id: string): Promise<boolean>;
}
