'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type {
  ReadingBook,
  ReadingNote,
  ReadingStatus,
} from '@algoflow/contracts';

export default function ReadingWorkspace({
  initialBook,
  initialNotes,
}: {
  initialBook: ReadingBook;
  initialNotes: ReadingNote[];
}) {
  const router = useRouter();
  const [book, setBook] = useState(initialBook);
  const [notes, setNotes] = useState(initialNotes);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState<string>();

  async function updateProgress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/reading', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          currentChapter: Number(form.get('currentChapter')),
          status: form.get('status') as ReadingStatus,
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error?.message || 'Could not save progress.');
      setBook(body.book);
      setMessage('Reading progress saved on the server.');
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not save progress.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function addNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/reading/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          chapter: form.get('chapter'),
          body: form.get('body'),
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error?.message || 'Could not save this note.');
      setNotes((items) => [...items, body.note]);
      event.currentTarget.reset();
      setMessage('Private synthesis note saved.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not save this note.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function convert(
    event: React.FormEvent<HTMLFormElement>,
    noteId: string,
  ) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setConverting(noteId);
    setMessage('');
    try {
      const response = await fetch('/api/reading/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId,
          prompt: form.get('prompt'),
          answer: form.get('answer'),
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error?.message || 'Could not create review.');
      setMessage('Review prompt scheduled for tomorrow.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not create review.',
      );
    } finally {
      setConverting(undefined);
    }
  }

  async function removeBook() {
    if (
      !window.confirm(
        `Delete ${book.title} and its notes? Review prompts already created will remain.`,
      )
    )
      return;
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/reading', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error?.message || 'Could not delete this book.');
      router.push('/reading');
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not delete this book.',
      );
      setLoading(false);
    }
  }

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[.72fr_1.28fr]">
      <div className="space-y-5">
        <form onSubmit={updateProgress} className="panel p-6">
          <p className="eyebrow">Reading progress</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <label className="text-xs text-subtle">
              Current chapter
              <input
                name="currentChapter"
                type="number"
                min="0"
                max={book.totalChapters}
                defaultValue={book.currentChapter}
                className="field mt-2 w-full px-4 py-3 text-base"
              />
            </label>
            <label className="text-xs text-subtle">
              Status
              <select
                name="status"
                defaultValue={book.status}
                className="field mt-2 w-full px-4 py-3 text-base"
              >
                {(
                  [
                    'planned',
                    'reading',
                    'paused',
                    'completed',
                  ] as ReadingStatus[]
                ).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button disabled={loading} className="button-primary mt-5 px-5 py-3">
            {loading ? 'Saving…' : 'Save progress'}
          </button>
        </form>
        <form onSubmit={addNote} className="panel p-6">
          <p className="eyebrow">New synthesis</p>
          <input
            name="chapter"
            type="number"
            min="1"
            max={book.totalChapters}
            placeholder="Chapter (optional)"
            className="field mt-5 w-full px-4 py-3"
          />
          <textarea
            name="body"
            required
            maxLength={2000}
            placeholder="Explain the idea in your own words…"
            className="field mt-3 min-h-36 w-full resize-y px-4 py-3"
          />
          <button
            disabled={loading}
            className="button-secondary mt-4 px-5 py-3"
          >
            Save private note
          </button>
        </form>
        <button
          onClick={removeBook}
          disabled={loading}
          className="text-sm text-danger"
        >
          Delete book and notes
        </button>
        {message && (
          <p
            role="status"
            className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted"
          >
            {message}
          </p>
        )}
      </div>

      <section>
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow">Your notes</p>
            <h2 className="mt-2 text-2xl font-semibold">
              {notes.length} synthesis {notes.length === 1 ? 'note' : 'notes'}
            </h2>
          </div>
        </div>
        {notes.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-line p-8">
            <p className="font-medium">No notes yet.</p>
            <p className="mt-2 text-sm text-subtle">
              Write one idea in your own words, then turn it into a recall
              prompt when useful.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {notes.map((note) => (
              <article
                key={note.id}
                className="rounded-2xl border border-line bg-surface p-6"
              >
                <p className="eyebrow">
                  {note.chapter ? `Chapter ${note.chapter}` : 'Book note'}
                </p>
                <p className="mt-4 whitespace-pre-wrap leading-7 text-ink-soft">
                  {note.body}
                </p>
                <details className="mt-5 border-t border-line pt-4">
                  <summary className="cursor-pointer text-sm text-ink">
                    Turn into spaced review
                  </summary>
                  <form
                    onSubmit={(event) => convert(event, note.id)}
                    className="mt-4 space-y-3"
                  >
                    <input
                      name="prompt"
                      required
                      maxLength={500}
                      placeholder="Recall prompt"
                      className="field w-full px-4 py-3"
                    />
                    <textarea
                      name="answer"
                      required
                      maxLength={2000}
                      placeholder="Answer or explanation"
                      className="field min-h-28 w-full resize-y px-4 py-3"
                    />
                    <button
                      disabled={converting === note.id}
                      className="button-primary px-4 py-2 text-sm"
                    >
                      {converting === note.id
                        ? 'Scheduling…'
                        : 'Schedule review'}
                    </button>
                  </form>
                </details>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
