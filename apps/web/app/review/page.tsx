import AppShell from '../../components/layout/AppShell';
import ReviewQueue from '../../components/learning/ReviewQueue';
import { getDueReviews } from '../../lib/server/learningData';

export const dynamic = 'force-dynamic';

export default async function ReviewPage() {
  const reviews = await getDueReviews();
  return (
    <AppShell>
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-warning">
        Spaced repetition
      </p>
      <h1 className="mt-3 text-4xl font-semibold">Review queue</h1>
      <p className="mt-3 max-w-2xl text-muted">
        The server schedules difficult concepts sooner and stable memories
        farther apart.
      </p>
      <div className="mt-10 max-w-3xl">
        <ReviewQueue initialReviews={reviews} />
      </div>
    </AppShell>
  );
}
