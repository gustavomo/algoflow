import Link from 'next/link';
import AppShell from '../../../components/layout/AppShell';
import ReadingWorkspace from '../../../components/reading/ReadingWorkspace';
import { getReadingBook } from '../../../lib/server/learningData';

export const dynamic = 'force-dynamic';

export default async function ReadingBookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { book, notes } = await getReadingBook(id);
  return (
    <AppShell>
      <Link href="/reading" className="text-sm text-subtle hover:text-ink">
        ← Reading library
      </Link>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">
            {book.status} · chapter {book.currentChapter}/{book.totalChapters}
          </p>
          <h1 className="mt-3 text-4xl font-semibold">{book.title}</h1>
          <p className="mt-2 text-muted">
            {book.author}
            {book.edition ? ` · ${book.edition}` : ''}
          </p>
        </div>
        <p className="text-sm text-subtle">
          {Math.round((book.currentChapter / book.totalChapters) * 100)}% read
        </p>
      </div>
      <ReadingWorkspace initialBook={book} initialNotes={notes} />
    </AppShell>
  );
}
