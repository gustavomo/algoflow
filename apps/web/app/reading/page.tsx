import AppShell from '../../components/layout/AppShell';
import ReadingLibrary from '../../components/reading/ReadingLibrary';
import { getReadingBooks } from '../../lib/server/learningData';

export const dynamic = 'force-dynamic';

export default async function ReadingPage() {
  const books = await getReadingBooks();
  return (
    <AppShell>
      <p className="eyebrow text-ink">Technical reading</p>
      <h1 className="mt-3 text-4xl font-semibold">
        Read, synthesize, remember.
      </h1>
      <p className="mt-3 max-w-3xl text-muted">
        Resume technical books, write your own compact notes, and deliberately
        convert only the useful ideas into spaced review.
      </p>
      <ReadingLibrary initialBooks={books} />
    </AppShell>
  );
}
