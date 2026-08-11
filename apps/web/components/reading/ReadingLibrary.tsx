'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ReadingBook } from '@algoflow/contracts';

export default function ReadingLibrary({
  initialBooks,
}: {
  initialBooks: ReadingBook[];
}) {
  const router = useRouter();
  const [books, setBooks] = useState(initialBooks);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function createBook(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.get('title'),
          author: form.get('author'),
          edition: form.get('edition'),
          totalChapters: Number(form.get('totalChapters')),
          currentChapter: 0,
          status: 'planned',
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error?.message || 'Could not add this book.');
      setBooks((items) => [body.book, ...items]);
      event.currentTarget.reset();
      setStatus('Book added to your private server library.');
      router.refresh();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'Could not add this book.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[.72fr_1.28fr]">
      <form onSubmit={createBook} className="panel h-fit p-6">
        <p className="eyebrow">Add a book</p>
        <h2 className="mt-3 text-xl font-semibold">What are you reading?</h2>
        <div className="mt-6 space-y-3">
          <input
            name="title"
            required
            maxLength={180}
            placeholder="Title"
            className="field w-full px-4 py-3"
          />
          <input
            name="author"
            required
            maxLength={140}
            placeholder="Author"
            className="field w-full px-4 py-3"
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <input
              name="edition"
              maxLength={80}
              placeholder="Edition (optional)"
              className="field w-full px-4 py-3"
            />
            <input
              name="totalChapters"
              type="number"
              min="1"
              max="10000"
              required
              placeholder="Chapters"
              className="field w-full px-4 py-3"
            />
          </div>
        </div>
        <button disabled={loading} className="button-primary mt-5 px-5 py-3">
          {loading ? 'Adding…' : 'Add to library'}
        </button>
        {status && (
          <p role="status" className="mt-4 text-sm text-muted">
            {status}
          </p>
        )}
        <p className="mt-5 text-xs leading-5 text-faint">
          Store your own synthesis only. AlgoFlow does not upload or index book
          text.
        </p>
      </form>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Private library</p>
            <h2 className="mt-2 text-2xl font-semibold">
              {books.length} {books.length === 1 ? 'book' : 'books'}
            </h2>
          </div>
        </div>
        {books.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-line p-8 text-center">
            <p className="text-lg font-medium">Your reading shelf is empty.</p>
            <p className="mt-2 text-sm text-subtle">
              Add one technical book and resume it from the server later.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {books.map((book) => {
              const percent = Math.round(
                (book.currentChapter / book.totalChapters) * 100,
              );
              return (
                <Link
                  key={book.id}
                  href={`/reading/${book.id}`}
                  className="rounded-2xl border border-line bg-surface p-6 transition hover:border-line-strong"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="eyebrow">{book.status}</span>
                    <span className="text-xs text-subtle">{percent}%</span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold">{book.title}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {book.author}
                    {book.edition ? ` · ${book.edition}` : ''}
                  </p>
                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-surface-raised">
                    <div
                      className="h-full rounded-full bg-action"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="mt-3 text-xs text-subtle">
                    Chapter {book.currentChapter} of {book.totalChapters}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
