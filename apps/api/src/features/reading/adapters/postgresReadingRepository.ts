import type { ReadingBook, ReadingNote } from '@algoflow/contracts';
import { getPool } from '../../../platform/db/client';
import type { ReadingRepository } from '../ports/readingRepository';

const PROFILE_ID = 'default';

function iso(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString() : undefined;
}

function mapBook(row: any): ReadingBook {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    edition: row.edition ?? undefined,
    totalChapters: row.total_chapters,
    currentChapter: row.current_chapter,
    status: row.status,
    startedAt: iso(row.started_at),
    completedAt: iso(row.completed_at),
    createdAt: iso(row.created_at)!,
    updatedAt: iso(row.updated_at)!,
  };
}

function mapNote(row: any): ReadingNote {
  return {
    id: row.id,
    bookId: row.book_id,
    chapter: row.chapter ?? undefined,
    body: row.body,
    createdAt: iso(row.created_at)!,
    updatedAt: iso(row.updated_at)!,
  };
}

export class PostgresReadingRepository implements ReadingRepository {
  async listBooks() {
    const result = await getPool().query(
      'SELECT * FROM reading_books WHERE profile_id = $1 ORDER BY updated_at DESC',
      [PROFILE_ID],
    );
    return result.rows.map(mapBook);
  }

  async getBook(id: string) {
    const result = await getPool().query(
      'SELECT * FROM reading_books WHERE profile_id = $1 AND id = $2',
      [PROFILE_ID, id],
    );
    return result.rows[0] ? mapBook(result.rows[0]) : undefined;
  }

  async saveBook(book: ReadingBook) {
    const result = await getPool().query(
      `INSERT INTO reading_books
        (id, profile_id, title, author, edition, total_chapters, current_chapter, status, started_at, completed_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title, author = EXCLUDED.author, edition = EXCLUDED.edition,
         total_chapters = EXCLUDED.total_chapters, current_chapter = EXCLUDED.current_chapter,
         status = EXCLUDED.status, started_at = EXCLUDED.started_at,
         completed_at = EXCLUDED.completed_at, updated_at = EXCLUDED.updated_at
       WHERE reading_books.profile_id = EXCLUDED.profile_id
       RETURNING *`,
      [
        book.id,
        PROFILE_ID,
        book.title,
        book.author,
        book.edition ?? null,
        book.totalChapters,
        book.currentChapter,
        book.status,
        book.startedAt ?? null,
        book.completedAt ?? null,
        book.createdAt,
        book.updatedAt,
      ],
    );
    return mapBook(result.rows[0]);
  }

  async deleteBook(id: string) {
    const result = await getPool().query(
      'DELETE FROM reading_books WHERE profile_id = $1 AND id = $2',
      [PROFILE_ID, id],
    );
    return result.rowCount === 1;
  }

  async listNotes(bookId: string) {
    const result = await getPool().query(
      'SELECT * FROM reading_notes WHERE profile_id = $1 AND book_id = $2 ORDER BY created_at',
      [PROFILE_ID, bookId],
    );
    return result.rows.map(mapNote);
  }

  async getNote(id: string) {
    const result = await getPool().query(
      'SELECT * FROM reading_notes WHERE profile_id = $1 AND id = $2',
      [PROFILE_ID, id],
    );
    return result.rows[0] ? mapNote(result.rows[0]) : undefined;
  }

  async saveNote(note: ReadingNote) {
    const result = await getPool().query(
      `INSERT INTO reading_notes (id, profile_id, book_id, chapter, body, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET chapter = EXCLUDED.chapter, body = EXCLUDED.body, updated_at = EXCLUDED.updated_at
       WHERE reading_notes.profile_id = EXCLUDED.profile_id
       RETURNING *`,
      [
        note.id,
        PROFILE_ID,
        note.bookId,
        note.chapter ?? null,
        note.body,
        note.createdAt,
        note.updatedAt,
      ],
    );
    return mapNote(result.rows[0]);
  }

  async deleteNote(id: string) {
    const result = await getPool().query(
      'DELETE FROM reading_notes WHERE profile_id = $1 AND id = $2',
      [PROFILE_ID, id],
    );
    return result.rowCount === 1;
  }
}
