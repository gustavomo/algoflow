import Link from 'next/link';
import AppShell from '../../components/layout/AppShell';
import { lessons } from '../../lib/content/catalog';
import { getLearningRepository } from '../../lib/persistence';

export const dynamic = 'force-dynamic';

export default async function ProgressPage() {
  const snapshot = await getLearningRepository().getSnapshot();
  const progress = new Map(
    snapshot.progress.map((item) => [item.lessonSlug, item]),
  );
  const average = snapshot.attempts.length
    ? Math.round(
        snapshot.attempts.reduce((sum, attempt) => sum + attempt.score, 0) /
          snapshot.attempts.length,
      )
    : 0;
  return (
    <AppShell>
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-emerald-300">
        Evidence, not streaks
      </p>
      <h1 className="mt-3 text-4xl font-semibold">Progress</h1>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-slate-500">Lessons complete</p>
          <p className="mt-2 text-3xl font-semibold">
            {
              snapshot.progress.filter((item) => item.status === 'completed')
                .length
            }
            /{lessons.length}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-slate-500">Assessment average</p>
          <p className="mt-2 text-3xl font-semibold">{average}%</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-slate-500">Scheduled concepts</p>
          <p className="mt-2 text-3xl font-semibold">
            {snapshot.reviews.length}
          </p>
        </div>
      </div>
      <div className="mt-10 space-y-3">
        {lessons.map((lesson) => {
          const state = progress.get(lesson.slug);
          return (
            <Link
              href={`/lessons/${lesson.slug}`}
              key={lesson.slug}
              className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.025] px-5 py-4"
            >
              <div>
                <p className="font-medium">{lesson.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {lesson.tech.toUpperCase()} · {lesson.estimatedMinutes} min
                </p>
              </div>
              <span
                className={
                  state?.status === 'completed'
                    ? 'text-emerald-300'
                    : 'text-slate-500'
                }
              >
                {state?.status ?? 'not started'}
              </span>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
